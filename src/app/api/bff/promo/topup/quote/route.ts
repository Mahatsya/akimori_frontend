import { proxyToBackend } from "@/app/api/bff/_utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/promo/topup/quote/");
}
