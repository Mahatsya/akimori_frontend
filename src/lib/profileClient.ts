// src/lib/profileClient.ts
export type PublicProfileClient = {
  user: { id: number; username: string };
  display_name?: string;
  avatar_url?: string | null;
  frame_url?: string | null;   // ← рамка теперь тоже
};

// заглушка-запрос для публичного профиля
const API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";

function stripAt(handle: string) {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

export async function fetchPublicProfileClient(
  handleOrUsername: string
): Promise<PublicProfileClient | null> {
  const username = stripAt(handleOrUsername);
  const url = `${API_BASE}/api/users/${encodeURIComponent(username)}/profile/`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PublicProfileClient;
  } catch {
    return null;
  }
}
