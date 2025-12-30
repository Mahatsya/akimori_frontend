import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/bff/_utils";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/promo/validate/");
}
