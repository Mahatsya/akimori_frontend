
// src/types/users.ts

/** ----- Роли пользователя ----- */
export type Role = "user" | "moderator" | "admin";

/** ----- Пользователь (базовая модель) ----- */
export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
}

/** ----- Профиль ----- */
export interface Profile {
  user: User;
  display_name?: string;
  bio?: string;
  avatar?: string | null;       // относительный путь (если бек так отдаёт)
  avatar_url?: string | null;   // абсолютный URL
  xp: number;
  level: number;
  max_level: number;
  next_level_xp: number;
  need_for_next: number;
  progress: number;             // от 0 до 1
  created_at: string;
  updated_at: string;
}

/** ----- Статусы аниме в списке ----- */
export type AnimeStatus =
  | "will_watch"
  | "watching"
  | "completed"
  | "planned"
  | "on_hold"
  | "rewatching"
  | "dropped";

/** ----- Элемент списка аниме пользователя ----- */
export interface UserAnimeListEntry {
  id: number;
  user: number; // id пользователя
  material: number; // id материала (kodik.Material)
  status: AnimeStatus;
  created_at: string;
  updated_at: string;
}

/** ----- Загруженные аватары ----- */
export interface AvatarMedia {
  id: number;
  user: number;
  file: string;       // относительный путь (например, avatars/1/2025/09/avatar.png)
  url: string;        // абсолютный URL (см. .url в модели)
  is_animated: boolean;
  created_at: string;
}
