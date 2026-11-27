"use client";

import { useState } from "react";
import Image from "next/image";
import { Laugh, Shuffle, ChevronRight } from "lucide-react";

interface MemeItem {
  id: string;
  src: string;
  tag: string;
  topText: string;
  caption: string;
}

const MEMES: MemeItem[] = [
  {
    id: "doakes",
    src: "/memes/meme-doakes.jpg",
    tag: "Doakes จับผิด Outlier",
    topText: "ME LOOKING AT JUN & AUG SPIKES:",
    caption: "เมื่อรู้ว่า 50 บิล Outlier (฿14.54M) แอบปั่นกราฟให้ดูพุ่ง แต่รัน IQR + Z-Score จับได้คาหนังคาเขา 🕵️‍♂️🚨",
  },
  {
    id: "nice",
    src: "/memes/meme-nice.jpg",
    tag: "100% FK Match · NICE",
    topText: "0 NULLS & 49,200 CLEAN ROWS:",
    caption: "หน้าตาของ Data Analyst ตอน DuckDB Parity ตรงกับ Pandas 100.00% ทุกทศนิยม: NOICE 👌✨",
  },
  {
    id: "pepe",
    src: "/memes/meme-pepe.jpg",
    tag: "Pepe ช็อกราคาต่อชิ้น",
    topText: "MEAN TOTAL_AMOUNT BEFORE CLEAN:",
    caption: "จ้องหน้าจอตอนเห็นลูกค้ากด Household 1,500 ชิ้นในบิลเดียวจน Std. Dev. พุ่งไป ฿15,698 👀📉",
  },
  {
    id: "selfie",
    src: "/memes/meme-selfie.jpg",
    tag: "Selfie With Top 10 VIP",
    topText: "ABER ZUERST... SELFIE 🤳",
    caption: "ก่อนพรีเซนต์ให้กรรมการ ขอเซลฟี่คู่กับ Customer 360° และกราฟสีรุ้งสักรูปนึงครับ 🐒🌈",
  },
  {
    id: "outlier",
    src: "/memes/meme-outlier.png",
    tag: "Outlier Shock · 50 Rows",
    topText: "ME: เปิด transactions_data.csv มาดูชิลๆ",
    caption: "เมื่อเจอคนกดสั่งของ 1,500 ชิ้นในบิลเดียว (฿1.33M) จน Mean พุ่งทะลุกราฟ 😱",
  },
  {
    id: "household",
    src: "/memes/meme-household.png",
    tag: "MVP หมวดสินค้า · 58.03%",
    topText: "HOUSEHOLD (฿890/ชิ้น) BE LIKE:",
    caption: "แบกรายได้ 82.49 ล้านบาท (58.03% ของทั้งบริษัท) ไว้บนบ่าคนเดียวชิลๆ 💪🛒",
  },
  {
    id: "clean",
    src: "/memes/meme-clean.png",
    tag: "Data Prep Peace · 0 Nulls",
    topText: "AFTER RUNNING clean_data.py:",
    caption: "หลับฝันดีแล้วคืนนี้ หลังตัด 750 NaN + แยก 50 Outliers เหลือ FK Match 100% 😴✨",
  },
  {
    id: "qa",
    src: "/memes/meme-qa.png",
    tag: "Judge Q&A Ready",
    topText: "กรรมการ: ทำไมไม่ใช้ Total_Amount หา Outlier?",
    caption: "ผม: กางสูตร Units_Sold > 38.5 โชว์กลางเวทีแบบตัวตึง 📊😎",
  },
];

interface MemeWidgetProps {
  compact?: boolean;
  isRainbow?: boolean;
}

export function MemeWidget({ compact = false, isRainbow = true }: MemeWidgetProps) {
  const [index, setIndex] = useState(0);
  const meme = MEMES[index];

  const nextMeme = () => {
    setIndex((prev) => (prev + 1) % MEMES.length);
  };

  const randomMeme = () => {
    const others = MEMES.map((_, i) => i).filter((i) => i !== index);
    const pick = others[Math.floor(Math.random() * others.length)] ?? 0;
    setIndex(pick);
  };

  return (
    <section className="bento-card p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2">
          <span
            className={`p-1.5 rounded-xl text-white ${
              isRainbow ? "rainbow-btn" : "bg-emerald-600"
            }`}
          >
            <Laugh className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Data Analyst Meme Corner
            </h3>
            <p className="text-[11px] text-slate-500">
              คลายเครียดกับชีวิตจริงของชุดข้อมูล SmartRetail ({index + 1}/{MEMES.length})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={randomMeme}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            สุ่ม Meme
          </button>
          <button
            type="button"
            onClick={nextMeme}
            className={`inline-flex items-center gap-0.5 px-3 py-1 rounded-full text-white text-[11px] font-bold shadow-xs transition-all ${
              isRainbow ? "rainbow-btn" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            ถัดไป
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${
          compact ? "h-44" : "h-56 sm:h-64"
        }`}
      >
        <Image
          src={meme.src}
          alt={meme.caption}
          fill
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/40 to-transparent px-3.5 py-2.5">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold mb-1">
            {meme.tag}
          </span>
          <p className="text-white text-xs sm:text-sm font-extrabold drop-shadow">
            {meme.topText}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3.5 py-2.5">
          <p className="text-white text-xs font-bold leading-snug drop-shadow">
            {meme.caption}
          </p>
        </div>
      </div>
    </section>
  );
}
