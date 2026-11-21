# DevQuest Atelier — แพลตฟอร์มฝึกเขียน HTML (FastAPI + Firebase + SOLO AI Studio)

แพลตฟอร์มเรียนรู้การเขียน HTML เชิงโต้ตอบสไตล์ **Tactile Editorial Arcade** (Warm Alabaster Paper + Midnight Blueprint) พร้อม **12 บทเรียน + 2 ด่าน Boss Citadel**, **Live DOM X-Ray**, **ระบบบอกใบ้ SOLO Taxonomy 5 ระดับ**, **AI SOLO Coach** (Local AST + รองรับ Google Gemini API), **ความปลอดภัยระดับ Production** และ **CI/CD Pipeline**

---

## ✨ จุดเด่นที่ออกแบบใหม่ทั้งหมด

1. **Tactile Editorial UI/UX (ไม่ซ้ำแนว AI ทั่วไป)**
   - โหมด **Paper Atelier** (กระดาษอุ่น + ขอบหมึก + เงากดยุบได้จริง) และ **Midnight Blueprint** (สลับได้ 1 คลิก)
   - **Interactive SVG Expedition Atlas**: แผนที่เส้นทางผจญภัย 14 ด่านพร้อมหมุดเรดาร์และตราประทับ `CLEARED`
   - **Boss Arena**: แถบพลังชีวิต Boss HP ที่ลดลงพร้อมแอนิเมชันสั่นสะเทือน + เสียง Web Audio FX + Confetti
   - **Live DOM X-Ray**: เห็นโครงสร้างต้นไม้แท็ก HTML และ Semantic Badges แบบเรียลไทม์ควบคู่กับ Sandboxed Live Browser
   - **SimCode Playground**: โหมดทดลองอิสระพร้อม Preset เทมเพลต, สลับขนาดหน้าจอ Desktop/Tablet/Mobile และส่งออกไฟล์ `.html`

2. **AI SOLO Taxonomy Coach (Hybrid Engine)**
   - ทำงานได้ทันที **แม้ไม่มี API Key** ด้วยตัววิเคราะห์ HTML AST + SOLO Level Engine ในเครื่อง (`POST /ai/solo-analyze`)
   - หากใส่ `GEMINI_API_KEY` ใน `.env` จะอัปเกรดเป็นโค้ช Socratic ด้วย **Google Gemini API** โดยไม่สปอยล์เฉลยตรง ๆ พร้อม Prompt-Injection Guardrails

3. **Security & CI/CD**
   - `bcrypt` (12 rounds), **JWT + Token Revocation** (`POST /auth/logout`), ป้องกัน IDOR, Rate Limiting (`slowapi`), Security Headers & CSP, `<iframe sandbox>`, `firestore.rules` แบบ Default-Deny
   - GitHub Actions **CI** (`ruff`, `bandit` SAST, `pip-audit`, `pytest`, JS syntax check, Docker build) + **CD** (Build & Push GHCR)

---

## ⚡ วิธีรันทันที (Quick Start)

```powershell
cd C:\Users\thana\.gemini\antigravity\scratch\devquest-atelier

# 1. สร้าง venv และติดตั้งแพ็กเกจ
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt

# 2. รันเซิร์ฟเวอร์ (เสิร์ฟทั้ง Backend API และ Frontend พร้อมกันที่พอร์ต 8000)
uvicorn app.main:app --reload --port 8000
```

จากนั้นเปิดเบราว์เซอร์ที่ **http://127.0.0.1:8000** ได้เลย!

- *(ค่าเริ่มต้นใช้ `STORAGE_BACKEND=local` เพื่อให้รันได้ทันทีโดยไม่ต้องตั้งค่า Firebase ก่อน — หากต้องการใช้ Firebase Firestore ให้คัดลอก `.env.example` เป็น `.env`, ตั้ง `STORAGE_BACKEND=firestore` และวาง `firebase-service-account.json` ที่รากโปรเจกต์)*
- *(หากต้องการเปิดโค้ช Gemini ให้ใส่ `GEMINI_API_KEY=...` ใน `.env`)*

---

## 🧪 รันการทดสอบและตรวจสอบความปลอดภัย

```powershell
ruff check app tests
bandit -r app -ll
pytest -v
```
