# คู่มือเชื่อมต่อ GitHub กับ Vercel (https://vercel.com/nrt6)

โปรเจกต์ Next.js Dashboard ถูกสร้างและทดสอบเรียบร้อยแล้วในโฟลเดอร์ `web/` และซิงค์อยู่บน GitHub repository `https://github.com/67219010015-bit/wine-ai-nrt` (branch `main`)

---

## วิธีเชื่อมต่อและ Deploy ขึ้น Vercel (3 ขั้นตอน)

1. **เข้าสู่หน้าสร้างโปรเจกต์ใหม่บนบัญชี Vercel (`nrt6`)**
   - เปิดเบราว์เซอร์ไปที่ [https://vercel.com/new](https://vercel.com/new) (ตรวจสอบให้แน่ใจว่าล็อกอินด้วยบัญชี/ทีม **nrt6**)
2. **Import Git Repository**
   - เลือก **Continue with GitHub** (เชื่อมต่อสิทธิ์ GitHub หากยังไม่ได้ผูก)
   - ค้นหาและกด **Import** ที่ repository **`67219010015-bit/wine-ai-nrt`**
3. **ตั้งค่า Root Directory และ Deploy**
   - ในช่อง **Root Directory** กด **Edit** แล้วเลือกโฟลเดอร์ **`web`** *(สำคัญมาก เพราะไฟล์ `package.json` ของ Next.js อยู่ใน `web/`)*
   - **Framework Preset**: `Next.js` (ระบบตรวจจับให้อัตโนมัติ)
   - *(ไม่บังคับ)* Environment Variables: หากต้องการเปลี่ยนรหัสผ่านทดสอบจากค่าเริ่มต้น (`judge@smartretail.th` / `SmartRetail2025`) ให้ตั้งค่า `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, และ `AUTH_SECRET` (ดูตัวอย่างใน `web/.env.example`)
   - กด **Deploy** รอประมาณ 1 นาที จะได้ URL ออนไลน์พร้อมใช้งานทันที และทุกครั้งที่ `git push` ขึ้น `main` Vercel จะ Deploy ให้อัตโนมัติ

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
