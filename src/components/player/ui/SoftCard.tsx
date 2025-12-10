"use client";
import React from "react";

export function SoftCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/95 backdrop-blur-xl shadow-[0_12px_44px_-18px_rgba(0,0,0,.35)] ${className}`}
    >
      {children}
    </div>
  );
}
