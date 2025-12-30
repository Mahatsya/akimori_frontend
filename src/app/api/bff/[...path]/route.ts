// src/app/api/bff/[...path]/route.ts
import type { NextRequest } from "next/server";
import { proxyToBackend } from "../_utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // важно для stream/duplex

type Ctx = { params: { path?: string[] } };

async function handle(req: NextRequest, ctx: Ctx) {
  const parts = ctx.params.path ?? [];
  const path = "/" + parts.join("/"); // например: /api/economy/wallets/me/
  return proxyToBackend(req, path);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
