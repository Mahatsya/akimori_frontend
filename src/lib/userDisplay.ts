// lib/userDisplay.ts
function base(u: any) {
  // если приходит { user: {...} } — берём внутренний объект
  return u?.user ?? u;
}

export function nameOf(u: any): string {
  const x = base(u);
  return x?.display_name || x?.profile?.display_name || x?.username || "user";
}

export function avatarOf(u: any): string | null {
  const x = base(u);
  return x?.profile?.avatar_url || x?.avatar_url || x?.avatar || null;
}

export function idOf(u: any): string {
  const x = base(u);
  return String(x?.id ?? "");
}
