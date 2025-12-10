"use client";
import React from "react";

export default function MetaBadges({ year, typeLabel }: { year?: number | null; typeLabel: string }) {
  return (
    <div className="absolute left-2 top-2 flex gap-2">
      <span className="px-2 py-0.5 rounded-md bg-[color:var(--secondary)] border border-[var(--border)] text-[11px] backdrop-blur">
        {year ?? "—"}
      </span>
      <span className="px-2 py-0.5 rounded-md bg-[color:var(--secondary)] border border-[var(--border)] text-[11px] backdrop-blur">
        {typeLabel}
      </span>
    </div>
  );
}
