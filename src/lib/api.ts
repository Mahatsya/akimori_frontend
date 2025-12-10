import axios, { AxiosHeaders } from "axios";
import { auth } from "@/auth";

import { SlugZ, MaterialDetailZ } from "./schemas";
import { api } from "./routes";

export async function getMaterial(slug: string) {
  const _slug = SlugZ.parse(slug);
  const res = await fetch(api.materialDetail(_slug), {
    // Детальная страница — не кэшируем, чтобы видеть обновления
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to load material ${_slug}: ${res.status} ${body}`);
  }
  const json = await res.json();
  return MaterialDetailZ.parse(json);
}

export const apiBase =
  process.env.API_BASE ||
  "http://127.0.0.1:8000";

export async function serverApi() {
  const session = await auth();
  const baseURL = apiBase.replace(/\/+$/, "");

  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: new AxiosHeaders({ Accept: "application/json" }),
  });

  client.interceptors.request.use((config) => {
    const access =
      (session as any)?.access ??
      (session as any)?.user?.access ??
      undefined;

    // гарантируем тип AxiosHeaders
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }

    if (access) (config.headers as AxiosHeaders).set("Authorization", `Bearer ${access}`);
    return config;
  });

  return client;
}
