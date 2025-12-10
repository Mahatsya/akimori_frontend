// src/app/api/proxy/kodik/aki/comments/[id]/unpin/route.ts
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

type RouteParams = { id: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<RouteParams> }
) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/api/aki/comments/${id}/unpin/`);
}
