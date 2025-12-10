import { NextResponse } from "next/server";

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v!;
}

const DEBUG = process.env.AVATAR_DEBUG === "1";

function dbg(...args: any[]) {
  if (!DEBUG) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[avatar] ${ts}`, ...args);
}

function joinUrl(base: string, ...parts: string[]) {
  const b = base.replace(/\/+$/, "");
  const p = parts
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return p ? `${b}/${p}/` : `${b}/`;
}

type Params = { id: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  const { id: userId } = await ctx.params; // <-- обязательно await

  const API_BASE = env("API_BASE", "http://127.0.0.1:8000");
  const API_PREFIX = (process.env.API_PREFIX ?? "/api").trim();

  if (!userId) {
    dbg("missing id param");
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const compactUrl = joinUrl(
    API_BASE,
    API_PREFIX,
    "users",
    encodeURIComponent(userId),
    "avatar"
  );

  dbg("fetch compact:", compactUrl);

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);

  try {
    const r = await fetch(compactUrl, {
      headers: { Accept: "application/json" },
      signal: ac.signal,
      cache: "no-store",
    });

    dbg("compact status:", r.status);

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      dbg("compact error body:", text?.slice(0, 500));
      return NextResponse.json(
        { error: "upstream error", status: r.status },
        { status: r.status }
      );
    }

    const j = await r.json();
    const avatar: string | null = j?.avatar_path ?? null;
    const ver: string | number | null = j?.avatar_ver ?? null;

    dbg("compact payload:", { avatar, ver });

    if (!avatar) {
      dbg("no avatar_path in payload");
      return NextResponse.json({ error: "no avatar" }, { status: 404 });
    }

    const target = new URL(avatar, API_BASE);
    if (ver != null) target.searchParams.set("v", String(ver));

    dbg("redirect →", target.toString());

    return NextResponse.redirect(target.toString(), { status: 307 });
  } catch (e: any) {
    dbg("exception:", e?.name || e, e?.message || "");
    if (e?.name === "AbortError") {
      return NextResponse.json({ error: "upstream timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "proxy failed" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
