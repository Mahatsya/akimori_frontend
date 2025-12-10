import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api";

export async function GET() {
  const api = await serverApi();
  const { data } = await api.get("/api/customitems/me/inventory/");
  return NextResponse.json(data);
}
