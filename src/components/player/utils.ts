import type { Episode, Version } from "@/components/PlayerSection";

export function pickLink(e?: Partial<Episode> | null): string | null {
  if (!e) return null;
  const cands = [e.link, (e as any)?.iframe, (e as any)?.iframe_src, (e as any)?.url];
  const found = cands.find((v) => typeof v === "string" && v.length > 0) as string | undefined;
  if (!found) return null;
  return found.startsWith("//") ? "https:" + found : found;
}

export const trName = (v?: Version) => v?.translation?.title || v?.translation?.name || "Оригинал";
