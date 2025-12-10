// src/components/anime/detail/atoms.tsx
import React from "react";

export function SoftCard({
  children,
  className = "",
  allowOverflow = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Разрешить контенту выходить за пределы карточки */
  allowOverflow?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl",
        "border border-[var(--border)]",
        "bg-[color:var(--card)]",
        "backdrop-blur-md",
        "shadow-[0_10px_40px_-15px_rgba(0,0,0,.3)]",
        allowOverflow ? "overflow-visible" : "overflow-hidden",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-[color:var(--secondary)] border border-[var(--border)] text-xs backdrop-blur">
      {children}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-[color:var(--secondary)] border border-[var(--border)] text-[12px]">
      {children}
    </span>
  );
}

export function Gauge({ label, value }: { label: string; value?: number | null }) {
  const v = typeof value === "number" ? Math.max(0, Math.min(10, value)) : null;
  const deg = v !== null ? (v / 10) * 360 : 0;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[color:var(--secondary)] border border-[var(--border)]">
      <div className="relative size-12 grid place-items-center">
        <div
          className="absolute inset-0 rounded-full [background:conic-gradient(var(--accent)_var(--p),transparent_0)]"
          style={{ ["--p" as any]: `${deg}deg` }}
        />
        <div className="absolute inset-[3px] rounded-full bg-[var(--background)] border border-[var(--border)]" />
        <span className="relative text-sm font-semibold">{v !== null ? v.toFixed(1) : "—"}</span>
      </div>
      <span className="text-xs text-[color:var(--foreground)/0.7] w-12">{label}</span>
    </div>
  );
}

export function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[color:var(--foreground)/0.6]">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
