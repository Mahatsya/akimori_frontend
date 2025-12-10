"use client";
import React from "react";

export default function GridHeader({ page, totalPages }: { total: number; page: number; totalPages: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="text-sm text-[color:var(--foreground)/0.65]">
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[color:var(--secondary)] px-2 py-1 text-xs">
        <span className="inline-flex size-1.5 rounded-full bg-emerald-400/90" />
        Страница <span className="font-semibold text-[var(--foreground)]">{page}</span>&nbsp;/ {totalPages}
      </span>
    </div>
  );
}
