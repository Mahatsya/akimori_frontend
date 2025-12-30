import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";

  const r = await fetch(`${API_BASE}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
