"use client";

import { useEffect, useRef } from "react";

// Draws text on a canvas instead of the DOM, so page readers, copy/paste and translate or
// "search this" extensions can't pick it up as text.
type Props = { text: string; size: number; weight?: number; color?: string; align?: "left" | "center"; className?: string };

export default function CanvasText({ text, size, weight = 700, color = "#f4f3ff", align = "left", className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.parentElement?.clientWidth || 300;
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d")!;
      const family = getComputedStyle(document.body).fontFamily || "sans-serif";
      ctx.font = `${weight} ${size}px ${family}`;
      const lines: string[] = [];
      let line = "";
      for (const word of text.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
      const lineH = Math.round(size * 1.35);
      canvas.width = width * dpr;
      canvas.height = lines.length * lineH * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${lines.length * lineH}px`;
      ctx.scale(dpr, dpr);
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.textAlign = align;
      lines.forEach((l, i) => ctx.fillText(l, align === "center" ? width / 2 : 0, i * lineH + lineH / 2));
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [text, size, weight, color, align]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
