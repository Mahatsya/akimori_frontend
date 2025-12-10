import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

const BACKEND_ORIGIN =
  (process.env.API_BASE || process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  // читаем оригинальные query (?search=...&page_size=...)
  const search = req.nextUrl.search || "";

  // собираем заголовки для бэка
  const h = new Headers();
  // пробрасываем только безопасные: Cookie и Authorization (если вы кладёте токен в заголовок)
  const cookieHeader = (await cookies()).toString(); // все куки этого запроса
  if (cookieHeader) h.set("cookie", cookieHeader);

  const auth = (await headers()).get("authorization");
  if (auth) h.set("authorization", auth);

  // не кэшируем персональные ответы
  h.set("accept", "application/json");

  const url = `${BACKEND_ORIGIN}/api/users/me/anime/${search}`;
  const res = await fetch(url, {
    method: "GET",
    headers: h,
    // важно: BFF сам серверный → здесь credentials не нужны
    cache: "no-store",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json; charset=utf-8" },
  });
}
