// src/lib/csrf.ts
// Простой и безопасный разбор document.cookie — без RegExp
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const raw = document.cookie;
  if (!raw) return null;

  const parts = raw.split("; ");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const k = decodeURIComponent(part.slice(0, eqIdx));
    if (k !== name) continue;
    const v = part.slice(eqIdx + 1);
    return decodeURIComponent(v);
  }
  return null;
}
