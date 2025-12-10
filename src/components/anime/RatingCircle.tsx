"use client";
import React from "react";
import { SiShikimori } from "react-icons/si";

export default function RatingCircle({ value }: { value: number | null | undefined }) {
  // защита от null / undefined / NaN / Infinity
  if (value === null || value === undefined || !Number.isFinite(value)) return null;

  const safe = Number(value);

  return (
    <div className="relative w-10 h-10 rounded-full bg-[color:var(--secondary)] backdrop-blur border border-[var(--border)] grid place-items-center">
      <span className="text-[11px] font-bold">{safe.toFixed(1)}</span>
      <span className="absolute -top-1 -right-1 text-[12px] px-1.5 py-[5px] rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow">
        <SiShikimori />
      </span>
    </div>
  );
}
