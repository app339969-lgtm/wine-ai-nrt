"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { MessageCircleQuestion, X } from "lucide-react";

export type StickerPlacement =
  | "corner-tr"
  | "corner-tl"
  | "corner-br"
  | "inline";

interface MemeStickerProps {
  src: string;
  alt: string;
  tag: string;
  roast: string;
  visible: boolean;
  placement?: StickerPlacement;
  tiltDeg?: number;
  size?: "sm" | "md";
  defaultOpen?: boolean;
  className?: string;
}

export function MemeSticker({
  src,
  alt,
  tag,
  roast,
  visible,
  placement = "inline",
  tiltDeg = -4,
  size = "sm",
  defaultOpen = false,
  className = "",
}: MemeStickerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

  if (!visible || dismissed) {
    return null;
  }

  const posClass =
    placement === "corner-tr"
      ? "hidden md:flex absolute -top-5 -right-3 z-20 flex-col items-end"
      : placement === "corner-tl"
        ? "hidden md:flex absolute -top-5 -left-3 z-20 flex-col items-start"
        : placement === "corner-br"
          ? "hidden md:flex absolute -bottom-4 -right-2 z-20 flex-col items-end"
          : "inline-flex flex-col items-start relative z-10";

  const bubbleAlignClass =
    placement === "corner-tr" || placement === "corner-br"
      ? "right-0 origin-top-right"
      : "left-0 origin-top-left";

  const imgBoxClass =
    size === "md" ? "w-20 h-20 sm:w-24 sm:h-24" : "w-14 h-14 sm:w-16 sm:h-16";

  const stickerStyle = {
    "--meme-rot": `${tiltDeg}deg`,
  } as CSSProperties;

  return (
    <div className={`${posClass} ${className}`}>
      <div
        style={stickerStyle}
        className="meme-sticker-bob group relative rounded-2xl bg-white/95 p-1 shadow-xl border-2 border-pink-400/80 hover:scale-110 transition-transform"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          aria-label={`ปิดมีม ${tag}`}
          title="ซ่อนมีมตัวนี้"
          className="absolute -top-2 -right-2 z-20 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-85 hover:opacity-100 hover:bg-rose-600 shadow-xs transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          title="คลิกดูแคปชั่นมีม"
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <div
            className={`relative overflow-hidden rounded-xl bg-slate-900 shrink-0 ${imgBoxClass}`}
          >
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              className="object-cover object-top"
            />
          </div>
          {placement === "inline" && (
            <div className="pr-2 max-w-[180px]">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-600 uppercase tracking-wide">
                <MessageCircleQuestion className="w-3 h-3" />
                {tag}
              </span>
              <p className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2">
                {roast}
              </p>
            </div>
          )}
        </button>

        {placement !== "inline" && (
          <div className="mt-1 px-1.5 py-0.5 rounded-lg rainbow-btn text-white text-[10px] font-extrabold text-center shadow-xs whitespace-nowrap">
            {tag}
          </div>
        )}
      </div>

      {open && placement !== "inline" && (
        <div
          className={`mt-1.5 w-56 rounded-2xl bg-slate-900/95 text-white text-[11px] leading-relaxed p-2.5 shadow-2xl border border-pink-400/50 backdrop-blur-md ${bubbleAlignClass}`}
        >
          <p className="font-bold text-amber-300 mb-0.5">{tag}</p>
          <p>{roast}</p>
        </div>
      )}
    </div>
  );
}
