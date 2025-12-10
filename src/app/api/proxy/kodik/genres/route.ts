import { NextRequest } from "next/server";
import { http } from "@/lib/http";
import qs from "qs";

const BACKEND = (process.env.API_BASE ?? "http://localhost:8000").replace(/\/+$/,"");

export async function GET(req: NextRequest) {
  const obj = Object.fromEntries(req.nextUrl.searchParams);
  const query = qs.stringify(obj, { encodeValuesOnly: true });
  const url = `${BACKEND}/api/kodik/materials/genres/${query ? `?${query}` : ""}`; // <-- новый экшн!

  const r = await http.get(url).catch((e) => e.response ?? new Response(null, { status: 502 }));
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
