"use client";

export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-[color:var(--foreground)]/60">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
