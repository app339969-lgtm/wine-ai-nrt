"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient Decorative Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-300/25 blur-3xl" />

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-6 items-stretch relative z-10 animate-fade-up">
        {/* Left Modern Bento Showcase */}
        <section className="md:col-span-6 rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-8 sm:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-50 text-xs font-semibold mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>SmartRetail Thailand · Analytics Suite</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight mb-3">
              Customer &amp; Sales Intelligence Hub
            </h1>
            <p className="text-emerald-50/90 text-sm leading-relaxed">
              สำรวจ Insight ยอดขายและพฤติกรรมลูกค้าแบบอินเทอร์แอคทีฟ พร้อมข้อมูลที่ผ่านการทำความสะอาดและตรวจสอบความถูกต้อง 100%
            </p>
          </div>

          {/* Mini Bento Preview Cards */}
          <div className="relative z-10 mt-8 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-4">
                <div className="flex items-center justify-between text-emerald-100 text-xs mb-1">
                  <span>Clean Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-200" />
                </div>
                <p className="text-xl font-bold tabular-nums">฿142.16M</p>
                <p className="text-[11px] text-emerald-100/80 mt-0.5">49,200 Valid Orders</p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-4">
                <div className="flex items-center justify-between text-emerald-100 text-xs mb-1">
                  <span>Data Integrity</span>
                  <BarChart2 className="w-4 h-4 text-emerald-200" />
                </div>
                <p className="text-xl font-bold tabular-nums">100.0%</p>
                <p className="text-[11px] text-emerald-100/80 mt-0.5">FK Match · 50 Outliers Isolated</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-50">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                Overview → Detail
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                What → So What → Now What
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                Instant CSV Export
              </span>
            </div>
          </div>
        </section>

        {/* Right Glassmorphic Sign-In Card */}
        <section className="md:col-span-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-emerald-950/10 shadow-bento p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#047857] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Judge &amp; Team Access
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">
              เข้าสู่ระบบแดชบอร์ด
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              เข้าใช้งานได้ทันทีด้วยบัญชีทดสอบสำหรับคณะกรรมการ
            </p>
          </div>

          {/* Demo Credentials Pill */}
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
                <Mail className="w-4 h-4 text-emerald-600/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="judge@smartretail.th"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-950/15 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
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
                <Lock className="w-4 h-4 text-emerald-600/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-950/15 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
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
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
            >
              <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่แดชบอร์ด"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
