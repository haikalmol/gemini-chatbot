// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Gemini setup ----------
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  GOOGLE_API_KEY/GEMINI_API_KEY belum di-set di .env');
}
const genAI = new GoogleGenerativeAI(API_KEY);
const GEMINI_MODEL = 'gemini-1.5-flash';
const getModel = () => genAI.getGenerativeModel({ model: GEMINI_MODEL });

// helper kecil
const b64 = (file) => file.buffer.toString('base64');

// Normalisasi MIME khusus audio (m4a sering terbaca audio/mp4)
function normalizeAudioMime(mime, filename = '') {
  const lower = (mime || '').toLowerCase();
  if (lower === 'audio/mp4' || lower === 'audio/x-m4a') return 'audio/m4a';
  if (lower) return lower;

  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'm4a') return 'audio/m4a';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'aac') return 'audio/aac';
  return 'application/octet-stream';
}

// ---------- Multer (memoryStorage) ----------
const memoryStorage = multer.memoryStorage();

const uploadImage = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const uploadAudio = multer({
  storage: memoryStorage,
  // terima aja dulu; validasi final di handler
  limits: { fileSize: 25 * 1024 * 1024 },
});

const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const ok = new Set([
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ]);
    if (ok.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Only PDF, TXT, DOCX are allowed'), false);
  },
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ---------- 1) Generate TEXT ----------
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() ?? 'No response text available.';
    res.json({ result: text });
  } catch (err) {
    console.error('Generate Text Error:', err);
    res.status(500).json({ error: `Failed to generate text: ${err.message}` });
  }
});

// ---------- 2) Generate FROM IMAGE ----------
app.post('/generate-from-image', uploadImage.single('image'), async (req, res) => {
  try {
    const { prompt = 'Deskripsikan gambar ini secara singkat.' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: req.file.mimetype, data: b64(req.file) } },
    ];

    const model = getModel();
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response?.text?.() ?? 'No response text available.';

    res.json({ result: text });
  } catch (err) {
    console.error('Generate From Image Error:', err);
    res.status(500).json({ error: `Failed to generate image description: ${err.message}` });
  }
});

// ---------- 3) Transcribe / Summarize FROM AUDIO ----------
app.post('/generate-from-audio', uploadAudio.single('audio'), async (req, res) => {
  try {
    const { prompt = 'Transkrip dan ringkas isi audio berikut.' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Audio file is required' });

    // Normalisasi mime (khususnya m4a)
    const mime = normalizeAudioMime(req.file.mimetype, req.file.originalname);
    const okTypes = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/aac']);
    if (!okTypes.has(mime)) {
      return res.status(415).json({ error: `Unsupported audio type: ${mime}` });
    }

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: mime, data: b64(req.file) } },
    ];

    const model = getModel();
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response?.text?.() ?? 'No response text available.';
    res.json({ result: text });
  } catch (err) {
    const msg = err?.error?.message || err?.message || String(err);
    console.error('Generate From Audio Error:', msg);
    if (/Only audio files|Unsupported audio type/i.test(msg)) {
      return res.status(415).json({ error: msg });
    }
    if (/Invalid|unsupported|exceeds|max|too large/i.test(msg)) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: msg });
  }
});

// ---------- 4) Summarize / Analyse FROM DOCUMENT ----------
app.post('/generate-from-document', uploadDocument.single('document'), async (req, res) => {
  try {
    const { prompt = 'Ringkas dokumen berikut secara poin-poin.' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Document file is required' });

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: req.file.mimetype, data: b64(req.file) } },
    ];

    const model = getModel();
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response?.text?.() ?? 'No response text available.';
    res.json({ result: text });
  } catch (err) {
    console.error('Generate From Document Error:', err);
    if (/Only PDF, TXT, DOCX/.test(err.message)) {
      return res.status(415).json({ error: err.message });
    }
    res.status(500).json({ error: `Failed to process document: ${err.message}` });
  }
});

// ---------- Health ----------
app.get('/', (_req, res) => {
  res.send('Gemini API is running. Endpoints: /generate-text, /generate-from-image, /generate-from-audio, /generate-from-document');
});

// ---------- Error middleware (JSON always) ----------
app.use((err, _req, res, _next) => {
  if (!err) return res.end();
  if (/^Only .* files are allowed/i.test(err.message)) {
    return res.status(415).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
