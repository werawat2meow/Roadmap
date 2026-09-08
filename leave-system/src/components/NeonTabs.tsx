"use client";
import React from "react";

type Props = {
  items: string[];            // ชื่อแท็บ
  value: string;              // แท็บที่ถูกเลือก
  onChange: (v: string) => void; // เวลาเปลี่ยนแท็บ
  className?: string;
};

export default function NeonTabs({ items, value, onChange, className }: Props) {
  const idx = Math.max(0, items.findIndex(i => i === value));
  const widthPct = 100 / items.length;

  return (
    <div className={`relative flex bg-[#101216] neon-tabs rounded-full p-2 ${className ?? ""}`}>
      {items.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`relative z-10 font-bold rounded-full transition text-center`}
            style={{
              width: `${widthPct}%`,
              padding: "8px 16px",
              color: active ? "#001418" : "#a3adc2",
            }}
          >
            {t}
          </button>
        );
      })}

      {/* แท่งเรืองแสงเลื่อนตามแท็บ */}
      <span
        className="absolute inset-y-1 left-1 rounded-full bg-[var(--cyan)] shadow-[0_0_10px_var(--cyan),0_0_24px_var(--cyan)] transition-transform duration-200"
        style={{
          width: `calc(${widthPct}% - 8px)`,
          transform: `translateX(calc(${idx} * ${widthPct}%))`,
        }}
      />
    </div>
  );
}
