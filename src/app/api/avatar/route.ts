// src/app/api/avatar/route.ts
import { NextResponse } from "next/server";

const DEBUG = process.env.AVATAR_DEBUG === "1";
const log = (...a: any[]) => DEBUG && console.log("[avatar]", new Date().toISOString(), ...a);

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`${name} is not set`);
  return v!;
}
function joinUrl(base: string, ...parts: string[]) {
  const b = base.replace(/\/+$/, "");
  const p = parts.map((s) => s.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  return p ? `${b}/${p}/` : `${b}/`;
}
async function fetchJson(url: string, signal?: AbortSignal) {
  const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal });
  return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : null };
}
// avatar | frame
function resolveKind(sp: URLSearchParams): "avatar" | "frame" {
  const raw =
    sp.get("kind") ??
    sp.get("type") ??
    sp.get("what") ??
    (sp.get("frame") ? "frame" : undefined) ??
    "avatar";
  return raw.toLowerCase() === "frame" ? "frame" : "avatar";
}

// базовая валидация «реальности» ника
function looksRealUsername(u: string) {
  // Разрешим латиницу/цифры/._- и длину ≥2
  return /^[a-z0-9_.-]{2,}$/i.test(u);
}
const BAD_SEEDS = new Set(["guest", "user", "you", "anonymous", "anon", "unknown", "вы"]);

export async function GET(req: Request) {
  const API_BASE   = env("API_BASE", "http://127.0.0.1:8000");   // серверный доступ к бэку
  const API_PREFIX = (process.env.API_PREFIX ?? "/api").trim();  // может быть пустым
  const { searchParams } = new URL(req.url);
  const kind = resolveKind(searchParams);

  let userId = searchParams.get("id") ?? searchParams.get("user_id");
  const rawSeed = searchParams.get("username") ?? searchParams.get("seed");
  const username = rawSeed ? decodeURIComponent(rawSeed) : null;

  log("query:", { id: userId, username, kind });

  // 0) Ранний выход для «плохих» seed'ов — не шумим в логах бэка.
  if (!userId && username) {
    const uname = username.trim();
    if (!looksRealUsername(uname) || BAD_SEEDS.has(uname.toLowerCase())) {
      log("skip seed → 204:", uname);
      return new NextResponse(null, { status: 204 });
    }
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 7000);

  try {
    let directUrl: string | null = null;

    // 1) По нику тянем публичный профиль: он может дать прямой URL
    if (!userId && username) {
      const profileUrl = joinUrl(API_BASE, API_PREFIX, "users", encodeURIComponent(username), "profile");
      log("profile:", profileUrl);
      const pr = await fetchJson(profileUrl, ac.signal);
      log("profile status:", pr.status);

      if (pr.ok && pr.json && typeof pr.json === "object") {
        const profile: any = pr.json;
        const avatarUrl: string | null = profile?.avatar_url ?? null;
        const frameUrl:  string | null = profile?.frame_url  ?? null;
        const profId:    number | null = profile?.user?.id   ?? null;

        if (kind === "avatar" && avatarUrl) directUrl = avatarUrl;
        if (kind === "frame"  && frameUrl)  directUrl = frameUrl;
        if (!directUrl && profId != null)   userId = String(profId);
      } else {
        // профиль по нику не найден/ошибка → не бьёмся дальше, тихо 204
        log("profile not found → 204");
        return new NextResponse(null, { status: 204 });
      }
    }

    // 2) Если нет прямого URL — берём компакт по id и вытаскиваем path
    if (!directUrl) {
      if (!userId) {
        // нет ни id, ни валидного профиля → мягко 204 (без ошибки)
        log("no id and no profile → 204");
        return new NextResponse(null, { status: 204 });
      }
      const compactUrl = joinUrl(API_BASE, API_PREFIX, "users", encodeURIComponent(userId), "avatar");
      log("compact:", compactUrl);
      const cr = await fetchJson(compactUrl, ac.signal);
      log("compact status:", cr.status);

      if (!cr.ok || !cr.json) {
        // если апстрим ответил ошибкой — пробросим код (или 502)
        return NextResponse.json({ error: "upstream error (compact)" }, { status: cr.status || 502 });
      }

      const data = cr.json as any;
      const avatarPath: string | null = data?.avatar_path ?? null;
      const framePath:  string | null = data?.frame_path  ?? null;
      const ver:        string | number | null = data?.avatar_ver ?? null;

      const chosen = kind === "frame" ? framePath : avatarPath;
      if (!chosen) {
        // мягко: нет рамки/аватара
        return new NextResponse(null, { status: 204 });
      }

      const url = new URL(chosen, API_BASE);
      if (ver != null) url.searchParams.set("v", String(ver));
      directUrl = url.toString();
    }

    // 3) STREAM: сервер качает файл и отдаёт его клиенту (same-origin, без mixed content)
    const mediaResp = await fetch(directUrl, { cache: "no-store", signal: ac.signal });
    log("media status:", mediaResp.status, directUrl);
    if (!mediaResp.ok) {
      // если файл пропал — 204, чтобы фронт тихо спрятал слой
      return new NextResponse(null, { status: 204 });
    }

    // пробросим важные заголовки
    const headers = new Headers();
    const copy = [
      "content-type",
      "cache-control",
      "etag",
      "last-modified",
      "content-length",
      "accept-ranges",
      "vary",
    ];
    for (const h of copy) {
      const v = mediaResp.headers.get(h);
      if (v) headers.set(h, v);
    }

    return new NextResponse(mediaResp.body, { status: 200, headers });
  } catch (e: any) {
    log("exception:", e?.name || e, e?.message || "");
    if (e?.name === "AbortError") {
      return NextResponse.json({ error: "upstream timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "proxy failed" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
