import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartRetail Thailand | Executive Analytics Dashboard",
  description:
    "ระบบวิเคราะห์พฤติกรรมลูกค้าและประสิทธิภาพยอดขายธุรกิจค้าปลีกอุปโภคบริโภค SmartRetail Thailand (49,200 Clean Transactions)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F7FAF8] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
