// src/app/api/proxy/kodik/aki/comments/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/aki/comments/");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/aki/comments/");
}
