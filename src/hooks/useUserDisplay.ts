// src/hooks/useUserDisplay.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPublicProfileClient } from "@/lib/profileClient";

export type DisplayInfo = { name: string; avatar: string | null; frame: string | null };

function base(u: any) {
  if (!u) return null;
  if (u.user) return u.user;
  return u;
}
function userKey(u: any) {
  const b = base(u);
  return b?.id || b?.username || "unknown";
}
function instantName(u: any) {
  const b = base(u);
  return (
    u?.display_name ||
    u?.profile?.display_name ||
    b?.display_name ||
    b?.username ||
    "user"
  );
}
function instantAvatar(u: any) {
  return u?.profile?.avatar_url || u?.avatar_url || u?.avatar || null;
}
function instantFrame(u: any) {
  return u?.profile?.frame_url || u?.frame_url || null;
}

export function useUserDisplay(u: any): DisplayInfo {
  const key = userKey(u);
  const [loaded, setLoaded] = useState<{
    name?: string;
    avatar?: string | null;
    frame?: string | null;
  }>({});

  const instant = useMemo<DisplayInfo>(
    () => ({
      name: instantName(u),
      avatar: instantAvatar(u),
      frame: instantFrame(u),
    }),
    [key]
  );

  useEffect(() => {
    let cancelled = false;
    const ident = base(u)?.username ?? base(u)?.id;
    if (!ident) return;

    if (instant.avatar && instant.frame && instant.name !== "user") return;

    fetchPublicProfileClient(ident).then((pp) => {
      if (cancelled || !pp) return;
      setLoaded({
        name: pp.display_name || pp.user?.username || instant.name,
        avatar: pp.avatar_url ?? instant.avatar ?? null,
        frame: pp.frame_url ?? instant.frame ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return {
    name: loaded.name || instant.name,
    avatar: loaded.avatar ?? instant.avatar ?? null,
    frame: loaded.frame ?? instant.frame ?? null,
  };
}
