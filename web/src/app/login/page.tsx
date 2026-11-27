"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Lock,
  Mail,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MemeWidget } from "@/components/MemeWidget";
import { MemeSticker } from "@/components/MemeSticker";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"rainbow" | "emerald">("rainbow");
  const [showMemes, setShowMemes] = useState(true);

  const isRainbow = themeMode === "rainbow";
  const memesVisible = isRainbow && showMemes;

  const handleQuickFill = () => {
    setEmail("judge@smartretail.th");
    setPassword("SmartRetail2025");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <main
      className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${
        isRainbow ? "theme-rainbow" : "theme-emerald"
      }`}
    >
      <div className="w-full max-w-5xl space-y-4 relative z-10 animate-fade-up">
        {/* Theme & Scattered Meme Switcher Pills */}
        <div className="flex flex-wrap justify-end gap-2">
          {isRainbow && (
            <button
              type="button"
              onClick={() => setShowMemes((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-sm hover:scale-105 transition-transform"
            >
              <span>{showMemes ? "🤣 มีมกระจัดกระจาย: เปิด" : "🙈 มีมกระจัดกระจาย: ปิด"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setThemeMode((prev) => (prev === "rainbow" ? "emerald" : "rainbow"))
            }
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-sm hover:scale-105 transition-transform"
          >
            <Palette className="w-3.5 h-3.5 text-pink-500" />
            <span>
              {isRainbow
                ? "🌈 Rainbow Mode (คลิกสลับเป็นเขียว-ขาว)"
                : "🌿 Clean Emerald (คลิกเปิดสีรุ้ง)"}
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          {/* Left Hero + Meme Corner */}
          <div className="md:col-span-6 relative flex">
            <MemeSticker
              src="/memes/meme-pepe.jpg"
              alt="Pepe looking surprised"
              tag="Pepe เช็กตัวเลข"
              roast="142.16 ล้านบาท จาก 49,200 บิลสะอาด — ตัด 50 Outliers ทิ้งไปแล้วนะจ๊ะ 👀"
              visible={memesVisible}
              placement="corner-tl"
              tiltDeg={-7}
            />
            <section
              className={`w-full rounded-3xl text-white p-7 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden ${
                isRainbow
                  ? "rainbow-hero"
                  : "bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600"
              }`}
            >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-4 border border-white/25">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ทีมวิทยาลัยเทคนิคนางรอง · SmartRetail Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight mb-2">
                Customer &amp; Sales Intelligence Hub
              </h1>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                แดชบอร์ดวิเคราะห์ยอดขายและพฤติกรรมลูกค้า 49,200 บิลสะอาด พร้อมมุกฮาๆ คลายเครียดก่อนเข้าสู่ระบบ
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-3.5">
                  <div className="flex items-center justify-between text-white/90 text-xs mb-1">
                    <span>Clean Revenue</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold tabular-nums">฿142.16M</p>
                </div>
                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-3.5">
                  <div className="flex items-center justify-between text-white/90 text-xs mb-1">
                    <span>Data Integrity</span>
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold tabular-nums">100.0% FK</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-5">
              <MemeWidget compact isRainbow={isRainbow} />
            </div>
            </section>
          </div>

          {/* Right Sign-In Card */}
          <section className="md:col-span-6 bento-card rounded-3xl p-8 sm:p-10 flex flex-col justify-center relative">
            <MemeSticker
              src="/memes/meme-selfie.jpg"
              alt="Monkey taking a selfie"
              tag="ขอเซลฟี่ก่อน 🤳"
              roast="ล็อกอินเข้าไปเจอแดชบอร์ดสีรุ้ง + 49,200 บิลพร้อมฟิลเตอร์ 7 มิติ!"
              visible={memesVisible}
              placement="corner-tr"
              tiltDeg={6}
            />
            <MemeSticker
              src="/memes/meme-nice.jpg"
              alt="Nice meme"
              tag="NOICE 👌"
              roast="ข้อมูลครบทุกตาราง 0 Nulls, FK 100.0% — พร้อมให้คะแนนเต็มแล้วครับ!"
              visible={memesVisible}
              placement="corner-br"
              tiltDeg={-4}
            />
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#047857] text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Judge &amp; Team Access
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-3">
                เข้าสู่ระบบแดชบอร์ด
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                กดปุ่มเติมข้อมูลทดสอบเพื่อเข้าไปดูสีรุ้งและกราฟทั้งหมดได้ทันที
              </p>
            </div>

            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-emerald-950 space-y-0.5">
                <p className="font-bold text-[#047857]">บัญชีทดสอบพร้อมใช้งาน (Demo)</p>
                <p>
                  User: <code className="font-mono font-semibold">judge@smartretail.th</code>
                </p>
                <p>
                  Pass: <code className="font-mono font-semibold">SmartRetail2025</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300 text-[#065F46] text-xs font-bold shadow-xs transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                กรอกอัตโนมัติ
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  อีเมลผู้ใช้งาน
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="judge@smartretail.th"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all disabled:opacity-60 ${
                  isRainbow
                    ? "rainbow-btn"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                }`}
              >
                <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่แดชบอร์ด"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Overview → Detail
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                49,200 Clean Rows
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Instant CSV Export
              </span>
            </div>

            {memesVisible && (
              <div className="mt-5 pt-4 border-t border-slate-200/70 flex flex-wrap items-center gap-3">
                <MemeSticker
                  src="/memes/meme-doakes.jpg"
                  alt="Doakes suspicious meme"
                  tag="Doakes จับตาดู 👀"
                  roast="รู้ทันนะว่ากำลังจะกดปุ่ม 'กรอกอัตโนมัติ' แทนการพิมพ์รหัสเอง 😎"
                  visible={memesVisible}
                  placement="inline"
                  tiltDeg={-2}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
