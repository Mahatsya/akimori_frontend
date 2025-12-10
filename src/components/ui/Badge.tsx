import Link from "next/link";
import clsx from "clsx";

export default function Badge({
  children,
  href,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  tone?: "muted" | "accent" | "success";
  className?: string;
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs border transition";
  const tones = {
    muted: "border-[var(--border)] bg-[color:var(--secondary)]",
    accent: "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 text-[color:var(--accent-foreground)]",
    success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  } as const;
  const cls = clsx(base, tones[tone], className);
  if (href) return <Link className={cls} href={href}>{children}</Link>;
  return <span className={cls}>{children}</span>;
}
