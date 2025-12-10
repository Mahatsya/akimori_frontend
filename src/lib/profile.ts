// src/lib/profile.ts
export type UserPublic = {
  id: number;
  username: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  date_joined?: string;
};

export type PublicProfile = {
  user: UserPublic;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  xp: number;
  level: number;
  max_level: number;
  next_level_total_xp: number;
  need_for_next: number;
  progress: number; // 0..1
};

const API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";

function stripAt(handle: string) {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

export async function fetchPublicProfile(handleOrUsername: string): Promise<PublicProfile> {
  const username = stripAt(handleOrUsername);
  const url = `${API_BASE}/api/users/${encodeURIComponent(username)}/profile/`;

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e: any) {
    // сеть/доступ/коннект
    throw new Error(`NETWORK_ERROR ${e?.message || ""}`.trim());
  }

  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) {
    // стянем тело для подсказки, даже если это не JSON
    const text = await res.text().catch(() => "");
    throw new Error(`FAILED ${res.status} ${text}`.trim());
  }

  try {
    return (await res.json()) as PublicProfile;
  } catch {
    throw new Error("BAD_JSON");
  }
}
