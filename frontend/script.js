const BASE_URL = 'http://localhost:3000';

// DOM
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const modeSel = document.getElementById('mode');

const fileInput = document.getElementById('file-input');
const pickFileBtn = document.getElementById('pick-file');
const fileNameEl = document.getElementById('file-name');

const sendBtn = document.getElementById('send-btn');
const hint = document.getElementById('hint');

const tplSel = document.getElementById('templates');
const tplHint = document.getElementById('tpl-hint');

const toggleHistoryBtn = document.getElementById('toggle-history');
const clearHistoryBtn = document.getElementById('clear-history');
const historyPanel = document.getElementById('history');
const historyList = document.getElementById('history-list');

// Templates per mode
const TEMPLATE_MAP = {
  text: [
    { label: 'Blog outline', value: 'Buat outline artikel blog tentang {topik} dengan 5 subjudul.' },
    { label: 'Explain like I’m five', value: 'Jelaskan konsep {konsep} dengan gaya yang mudah dipahami anak umur 10 tahun.' },
    { label: 'Pros & Cons', value: 'Sebutkan kelebihan dan kekurangan dari {produk/ide} secara poin-poin.' },
  ],
  image: [
    { label: 'Describe product photo', value: 'Deskripsikan isi gambar ini, fokus pada objek utama dan suasana keseluruhan.' },
    { label: 'Extract text (OCR-ish)', value: 'Jika ada teks dalam gambar, transkripsikan dan rangkum poin pentingnya.' },
  ],
  audio: [
    { label: 'Transcribe to Indonesian', value: 'Transkrip audio ini ke bahasa Indonesia dengan paragraf rapi.' },
    { label: 'Transcribe + summary', value: 'Transkrip audio ini lalu berikan ringkasan 3-5 poin.' },
  ],
  document: [
    { label: 'Summarize doc', value: 'Ringkas dokumen berikut menjadi 5-7 poin penting.' },
    { label: 'Extract action items', value: 'Ambil action items dari dokumen dan tulis dalam daftar to-do.' },
  ],
};

// ===== Utilities
const saveHistory = (item) => {
  const key = 'gemini_history';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.unshift(item);
  // simpan max 50 item
  localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
};

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('gemini_history') || '[]');
  } catch {
    return [];
  }
};

const renderHistory = () => {
  const items = loadHistory();
  historyList.innerHTML = '';
  if (!items.length) {
    historyList.innerHTML = `<li class="history-item"><div class="history-text">Empty.</div></li>`;
    return;
  }
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div class="history-meta">
        <span>• ${new Date(it.ts).toLocaleString()}</span>
        <span>• ${it.mode.toUpperCase()}</span>
        ${it.fileMeta ? `<span>• ${it.fileMeta.name} (${it.fileMeta.type || 'file'})</span>` : ''}
      </div>
      <div class="history-text"><strong>Prompt:</strong> ${escapeHtml(it.prompt || '(empty)')}</div>
      <div class="history-text"><strong>Result:</strong> ${escapeHtml((it.result || '').slice(0, 280))}${(it.result || '').length > 280 ? '…' : ''}</div>
    `;
    li.addEventListener('click', () => {
      // restore ke input & mode
      modeSel.value = it.mode;
      input.value = it.prompt || '';
      refreshModeUI();
      appendMessage('bot', it.result || '(no result)');
      if (it.fileMeta) {
        fileNameEl.textContent = `${it.fileMeta.name}`;
      } else {
        fileNameEl.textContent = 'No file';
      }
    });
    historyList.appendChild(li);
  });
};

const clearHistory = () => {
  localStorage.removeItem('gemini_history');
  renderHistory();
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[m]));
}

function appendMessage(sender, text, attachmentHTML = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble ' + sender;
  wrapper.textContent = text;
  if (attachmentHTML) {
    const attach = document.createElement('div');
    attach.className = 'attachment';
    attach.innerHTML = attachmentHTML;
    wrapper.appendChild(attach);
  }
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setBusy(busy) {
  input.disabled = busy;
  modeSel.disabled = busy;
  fileInput.disabled = busy;
  pickFileBtn.disabled = busy;
  sendBtn.disabled = busy;
  tplSel.disabled = busy;
}

// ===== Mode / File UI
function rebuildTemplates() {
  const m = modeSel.value;
  tplSel.innerHTML = `<option value="">— Select a template (optional) —</option>`;
  (TEMPLATE_MAP[m] || []).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    tplSel.appendChild(opt);
  });
}

function refreshModeUI() {
  const m = modeSel.value;
  // file accept + hint
  if (m === 'image') {
    fileInput.accept = 'image/*';
    hint.textContent = 'Upload gambar (jpg/png/webp) + prompt opsional.';
  } else if (m === 'audio') {
    fileInput.accept = 'audio/*';
    hint.textContent = 'Upload audio (mp3/wav/m4a/webm/aac) + prompt opsional.';
  } else if (m === 'document') {
    fileInput.accept = '.pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    hint.textContent = 'Upload dokumen (PDF/TXT/DOCX) + prompt opsional.';
  } else {
    fileInput.accept = '';
    hint.textContent = 'Kirim teks biasa ke Gemini.';
  }
  // clear file selection text (jika ganti mode)
  if (fileInput.files && fileInput.files.length) {
    // biarkan nama file tampak
  } else {
    fileNameEl.textContent = 'No file';
  }
  rebuildTemplates();
}

// ===== Event wiring
pickFileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  fileNameEl.textContent = f ? `${f.name}` : 'No file';
});

modeSel.addEventListener('change', () => {
  refreshModeUI();
});

tplSel.addEventListener('change', () => {
  const val = tplSel.value || '';
  if (!val) return;
  // Kalau input kosong → isi, kalau tidak → timpa.
  input.value = val;
  input.focus();
});

// history
toggleHistoryBtn?.addEventListener('click', () => {
  if (!historyPanel) return;
  historyPanel.classList.toggle('hidden');
  if (!historyPanel.classList.contains('hidden')) {
    renderHistory();
  }
});

clearHistoryBtn?.addEventListener('click', clearHistory);

// ===== Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const mode = modeSel.value;
  const userMessage = input.value.trim();
  const file = fileInput.files?.[0];

  // tampilkan prompt user (bubble)
  if (userMessage) appendMessage('user', userMessage);
  if (!userMessage && mode === 'text' && !file) return;

  try {
    setBusy(true);
    appendMessage('bot', 'Thinking…');

    let res;
    if (mode === 'text') {
      res = await fetch(`${BASE_URL}/generate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });
    } else {
      if (!file) throw new Error('Please choose a file first.');
      const fd = new FormData();
      fd.append('prompt', userMessage || '');

      let endpoint = '';
      if (mode === 'image') {
        fd.append('image', file);
        endpoint = 'generate-from-image';
      } else if (mode === 'audio') {
        fd.append('audio', file);
        endpoint = 'generate-from-audio';
      } else {
        fd.append('document', file);
        endpoint = 'generate-from-document';
      }

      res = await fetch(`${BASE_URL}/${endpoint}`, { method: 'POST', body: fd });
    }

    // parse respons robust
    const ct = res.headers.get('content-type') || '';
    let data;
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text.slice(0, 500) };
    }

    const last = chatBox.lastElementChild; // bubble "Thinking…"
    const textOut = data?.result || data?.error || 'No response';
    if (last && last.classList.contains('bot')) {
      last.textContent = textOut;
    } else {
      appendMessage('bot', textOut);
    }

    // Simpan ke history
    saveHistory({
      ts: Date.now(),
      mode,
      prompt: userMessage,
      fileMeta: file ? { name: file.name, type: file.type || '' } : null,
      result: textOut
    });

  } catch (err) {
    const last = chatBox.lastElementChild;
    const msg = 'Error: ' + (err?.message || String(err));
    if (last && last.classList.contains('bot')) last.textContent = msg;
    else appendMessage('bot', msg);
  } finally {
    setBusy(false);
    input.value = '';
  }
});

// init
refreshModeUI();
renderHistory();
