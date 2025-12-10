export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

// GET /api/proxy/kodik/aki/ratings/me?material=<id>
export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/aki/ratings/me/");
}
