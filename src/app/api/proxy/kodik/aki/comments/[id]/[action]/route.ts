// src/app/api/proxy/kodik/aki/comments/[id]/[action]/route.ts
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

type RouteParams = { id: string; action: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<RouteParams> }
) {
  // → POST /api/aki/comments/{id}/like/ | unlike | pin | unpin
  const { id, action } = await ctx.params;

  return proxyToBackend(req, `/api/aki/comments/${id}/${action}/`);
}
