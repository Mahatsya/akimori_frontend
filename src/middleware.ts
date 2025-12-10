// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role === "admin" || role === "moderator") return NextResponse.next();

  const url = new URL("/auth/login", req.url);
  url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
