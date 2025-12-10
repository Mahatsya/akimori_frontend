// src/lib/origin.ts
import { headers } from "next/headers";

/**
 * Определяет origin текущего запроса, вроде:
 *   http://localhost:3000
 *   https://akimori.kz
 */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers(); // теперь ждём Promise

  const host = h.get("x-forwarded-host") ?? h.get("host");
  // За обратным прокси чаще приходит x-forwarded-proto
  const proto = h.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Host header is missing");
  }

  return `${proto}://${host}`;
}
