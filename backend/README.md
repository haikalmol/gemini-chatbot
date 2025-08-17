# Gemini AI API Project

This project is a simple **Express.js API** that integrates with **Google Gemini AI** to handle multiple input types:
- Generate text from prompt
- Generate text from image
- Transcribe / analyze audio
- Summarize / analyze documents

---

## 🚀 Features
- **/generate-text** → input plain text prompt, get AI response  
- **/generate-from-image** → upload image + prompt, get AI-generated description/analysis  
- **/generate-from-audio** → upload audio (mp3/m4a/wav) + prompt, get transcription/summary  
- **/generate-from-document** → upload document (pdf/txt/docx) + prompt, get summary/analysis  

---

## 📦 Requirements
- Node.js v18+ (tested on v22)  
- npm (comes with Node.js)  
- Google Gemini API key  

---

## ⚙️ Installation
Clone this repo and install dependencies:
```bash
git clone https://github.com/your-username/gemini-ai-api-project.git
cd gemini-ai-api-project
npm install
