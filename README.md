<img width="1919" height="985" alt="image" src="https://github.com/user-attachments/assets/2c5c8a00-2407-4173-b30f-52624435209d" /># Gemini AI Chatbot

🚀 **Gemini AI Chatbot** adalah proyek chatbot berbasis **Google Gemini API** dengan dukungan multimodal:
- **Text → Generate**
- **Image → Describe**
- **Audio → Transcribe**
- **Document → Summarize**

Struktur repo ini dipisahkan menjadi **frontend** dan **backend** agar lebih terorganisir.

---

## 📂 Struktur Folder
gemini-chatbot/
│
├── backend/ # Server Node.js (Express, Multer, Gemini API)
│ ├── index.js
│ ├── package.json
│ ├── .env.example
│ └── ...
│
├── frontend/ # UI sederhana untuk Chatbot
│ ├── index.html
│ ├── style.css
│ └── script.js
│
└── README.md


---

## ⚙️ Instalasi & Menjalankan

### 1. Clone repo
```bash
git clone https://github.com/haikalmol/gemini-chatbot.git
cd gemini-chatbot

2. Setup Backend

Masuk ke folder backend:

cd backend
npm install

Buat file .env berdasarkan .env.example:

GEMINI_API_KEY=YOUR_API_KEY
PORT=3000

Jalankan server:

node index.js
Backend akan jalan di http://localhost:3000.

3. Setup Frontend

Frontend ada di folder frontend/.

Cukup buka index.html di browser (klik 2x atau pakai Live Server di VSCode).

🎯 Fitur Utama

Chat UI modern dengan bubble style (mirip Gemini/ChatGPT).

Upload Image, Audio, Document dengan preview & response.

Local Chat History.

Prompt Templates (memudahkan reuse prompt umum).

Backend menggunakan Express + Multer untuk handle upload.

Terhubung dengan Google Gemini API.

📸 Screenshot

Tampilan frontend:
<img width="1919" height="985" alt="image" src="https://github.com/user-attachments/assets/a6a84336-b76d-47f1-a19f-058a220fcb2c" />


🛠️ Teknologi

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express, Multer

API: Google Gemini

🤝 Kontribusi

Fork repo ini

Buat branch baru (git checkout -b feature-xyz)

Commit perubahanmu (git commit -m 'Add new feature')

Push branch (git push origin feature-xyz)

Buat Pull Request

📄 License

MIT License © 2025 Haikalmol
