"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

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
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#F7FAF8] via-white to-[#ECFDF5]">
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white border border-[#DCE7E0] rounded-2xl shadow-sm overflow-hidden">
        {/* Left Formal Brand Panel */}
        <section className="md:col-span-2 bg-[#065F46] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>SmartRetail Thailand Analytics</span>
            </div>
            <h1 className="text-2xl font-bold leading-snug mb-3">
              ระบบวิเคราะห์พฤติกรรมลูกค้าและประสิทธิภาพยอดขาย
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              แดชบอร์ดผู้บริหารตามเกณฑ์มาตรฐาน อศท. ข้อมูลผ่านการทำความสะอาดและตรวจสอบ Integrity ครบถ้วน 100%
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-500/40 space-y-2.5 text-xs text-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>49,200 Clean Transactions / 1,000 Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>FK Match Rate 100% + Audit Log 50 Outliers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Overview → Detail Drill-down &amp; CSV Export</span>
            </div>
          </div>
        </section>

        {/* Right Login Form */}
        <section className="md:col-span-3 p-8 md:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
              Executive &amp; Judge Access
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              เข้าสู่ระบบแดชบอร์ด
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              กรอกบัญชีผู้ใช้หรือกดปุ่มเติมข้อมูลทดสอบสำหรับคณะกรรมการ
            </p>
          </div>

          {/* Demo Credentials Callout */}
          <div className="mb-6 p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-[#065F46] space-y-0.5">
              <p className="font-semibold">บัญชีทดสอบสำหรับกรรมการ (Demo Login)</p>
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
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              กรอกอัตโนมัติ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCE7E0] bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCE7E0] bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              <span>{loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบแดชบอร์ด"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
