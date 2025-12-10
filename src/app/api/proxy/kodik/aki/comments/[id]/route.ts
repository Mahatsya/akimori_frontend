// src/app/api/proxy/kodik/aki/comments/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

type RouteParams = { id: string };

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<RouteParams> }
) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/api/aki/comments/${id}/`);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<RouteParams> }
) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/api/aki/comments/${id}/`);
}
