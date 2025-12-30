import { proxyToBackend } from "@/app/api/bff/_utils";

export async function GET(req: Request) {
  return proxyToBackend(req as any, "/api/auth/me/");
}
