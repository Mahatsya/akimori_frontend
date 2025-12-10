import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api";

export async function GET() {
  const api = await serverApi();
  const { data } = await api.get("/api/users/me/profile/settings/");
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const api = await serverApi();
  const body = await req.json();
  const { data } = await api.patch("/api/users/me/profile/settings/", body);
  return NextResponse.json(data);
}
