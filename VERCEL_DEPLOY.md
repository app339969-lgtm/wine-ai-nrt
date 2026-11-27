# คู่มือเชื่อมต่อ GitHub กับ Vercel (https://vercel.com/app339969-8085)

โปรเจกต์ Next.js Dashboard ถูกสร้างและทดสอบเรียบร้อยแล้วในโฟลเดอร์ `web/` และซิงค์อยู่บน GitHub repository `https://github.com/app339969-lgtm/wine-ai-nrt` (branch `main`)

---

## วิธีที่ 1: เชื่อมต่อและ Deploy ผ่านหน้าเว็บ Vercel (แนะนำ — 3 ขั้นตอน)

1. **เข้าสู่หน้าสร้างโปรเจกต์ใหม่บนบัญชี Vercel (`app339969-8085`)**
   - เปิดเบราว์เซอร์ไปที่ [https://vercel.com/new](https://vercel.com/new) (ตรวจสอบมุมซ้ายบนให้เป็นบัญชี/ทีม **`app339969-8085`**)
2. **Import Git Repository**
   - เลือก **Continue with GitHub** (ล็อกอิน/อนุญาตสิทธิ์บัญชี `app339969-lgtm` หากระบบขอ)
   - ค้นหาและกด **Import** ที่ repository **`app339969-lgtm/wine-ai-nrt`**
3. **ตั้งค่า Root Directory และ Deploy**
   - ในช่อง **Root Directory** กด **Edit** แล้วเลือกโฟลเดอร์ **`web`** *(สำคัญมาก เพราะไฟล์ `package.json` ของ Next.js อยู่ใน `web/`)*
   - **Framework Preset**: `Next.js` (ระบบตรวจจับให้อัตโนมัติ)
   - *(ไม่บังคับ)* Environment Variables: หากต้องการเปลี่ยนรหัสผ่านทดสอบจากค่าเริ่มต้น (`judge@smartretail.th` / `SmartRetail2025`) ให้ตั้งค่า `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, และ `AUTH_SECRET` (ดูตัวอย่างใน `web/.env.example`)
   - กด **Deploy** รอประมาณ 1 นาที จะได้ URL ออนไลน์พร้อมใช้งานทันที และทุกครั้งที่ `git push` ขึ้น `main` Vercel จะ Deploy ให้อัตโนมัติ

---

## วิธีที่ 2: เชื่อมต่อผ่าน Vercel CLI (ทางเลือกใน PowerShell)

```powershell
& "C:\Program Files\nodejs\npm.cmd" install -g vercel
& "C:\Program Files\nodejs\vercel.cmd" login
Set-Location C:\W-AI\web
& "C:\Program Files\nodejs\vercel.cmd" link --scope app339969-8085
& "C:\Program Files\nodejs\vercel.cmd" git connect https://github.com/app339969-lgtm/wine-ai-nrt.git
& "C:\Program Files\nodejs\vercel.cmd" --prod
```

---

## ข้อมูลบัญชีทดสอบสำหรับคณะกรรมการ (Test Login)
- **Email**: `judge@smartretail.th`
- **Password**: `SmartRetail2025`
- *(หน้า `/login` มีปุ่ม **"กรอกอัตโนมัติ"** ให้กรรมการกดเข้าทดสอบได้ทันที)*

## การรันสำรองบนเครื่อง (Offline Fallback)
หากต้องการรันในห้องแข่งขันแบบออฟไลน์ สามารถดับเบิลคลิกไฟล์ `run_dashboard.bat` หรือรันใน PowerShell:
```powershell
.\run_dashboard.ps1
```
จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
