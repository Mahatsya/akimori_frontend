// Универсальный парсер ответа /api/kodik/video-link/

export type KodikLinkValue =
  | string
  | { Src?: string; src?: string; Type?: string; type?: string };

export type KodikResponse = {
  links?: Record<string, KodikLinkValue>;
  url?: string;
  m3u8?: string;
  mp4?: string;
  segments?: {
    ad?: Array<{ start: number; end: number }>;
    skip?: Array<{ start: number; end: number }>;
    [k: string]: any;
  };
  [k: string]: any;
};

export type Segment = { type: "ad" | "skip"; start: number; end: number };

export type ParsedKodik = {
  directUrl: string | null;
  kind: "hls" | "mp4" | "unknown";
  qualities: Array<{ label: 720 | 480 | 360; url: string }>;
  segments: Segment[];
};

const norm = (u: string) => (u?.startsWith("//") ? "https:" + u : u);

function valToUrl(v: KodikLinkValue | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return norm(v);
  const s = (v.Src || (v as any).src || "").toString().trim();
  return s ? norm(s) : null;
}

function detectKind(u: string): "hls" | "mp4" | "unknown" {
  const l = u.toLowerCase();
  if (l.includes("m3u8") || l.includes(":hls:")) return "hls";
  if (l.endsWith(".mp4")) return "mp4";
  return "unknown";
}

export function parseKodik(resp: KodikResponse): ParsedKodik {
  const out: ParsedKodik = { directUrl: null, kind: "unknown", qualities: [], segments: [] };

  // только 720/480/360
  const wanted: Array<720 | 480 | 360> = [720, 480, 360];
  if (resp?.links && typeof resp.links === "object") {
    for (const q of wanted) {
      const raw = resp.links[String(q)];
      const url = valToUrl(raw);
      if (url) out.qualities.push({ label: q, url });
    }
  }

  // fallback
  const fallbacks = [resp?.m3u8, resp?.mp4, resp?.url]
    .map((x) => (typeof x === "string" && x ? norm(x) : null))
    .filter(Boolean) as string[];

  if (out.qualities.length) {
    const best = [...out.qualities].sort((a, b) => b.label - a.label)[0];
    out.directUrl = best.url;
    out.kind = detectKind(best.url);
  } else if (fallbacks.length) {
    out.directUrl = fallbacks[0];
    out.kind = detectKind(fallbacks[0]);
  }

  // сегменты
  const seg = resp?.segments;
  if (seg && typeof seg === "object") {
    for (const t of ["ad", "skip"] as const) {
      const arr = Array.isArray(seg[t]) ? seg[t] : [];
      for (const s of arr) {
        const start = Number(s?.start);
        const end = Number(s?.end);
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
          out.segments.push({ type: t, start, end });
        }
      }
    }
  }

  return out;
}
