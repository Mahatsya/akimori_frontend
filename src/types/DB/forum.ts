// src/types/DB/forum.ts

/** Базовые алиасы */
export type ID = number;
export type DateTimeString = string;

export type ThreadExtra = {
  banner?: { text: string; variant?: "info"|"success"|"warning"|"error"; until?: string|null };
  seo?: { title?: string; description?: string; noindex?: boolean };
  links?: { source?: string; official?: string; related_threads?: number[] };
  mod?: { needs_review?: boolean; locked_until?: string|null; reason?: string|null };
  ui?: { show_toc?: boolean; highlight_staff_comments?: boolean; collapse_long_posts?: boolean };
  badges?: { text: string; color?: string }[];
  pins?: { comment_ids?: number[]; notice?: string };
  rollout?: { ab_test?: string; flags?: Record<string, boolean> };
  poll?: { question: string; options: string[]; multi?: boolean; ends_at?: string|null };
};

/** Общий миксин времени (как в DRF) */
export interface TimeStamped {
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/* ===================== Категории ===================== */

export interface Category extends TimeStamped {
  id: ID;
  title: string;
  slug: string;
  is_active: boolean;
  order: number;
}

/* ===================== Типы тем (ThreadKind) ===================== */

export interface ThreadKind extends TimeStamped {
  id: ID;
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  order: number;

  allow_anime: boolean;
  allow_manga: boolean;
  allow_publish_as_team: boolean;
}

/* ===================== Теги ===================== */

export interface Tag extends TimeStamped {
  id: ID;
  title: string;
  slug: string;
}

/* ===================== Внешние сущности (минимум) ===================== */

export interface KodikMaterial {
  id?: ID;               // если у вас нет int id, пусть будет опционален
  kodik_id: string;
  slug: string;
  title: string;
}

export interface Manga {
  id: ID;
  slug: string;
  title_ru: string;
  title_en?: string | null;
}

export interface TranslatorPublisher {
  id: ID;
  name: string;
  slug: string;
  avatar_url?: string | null;
  frame_url?: string | null;
}

/* ===================== Вложения к теме ===================== */

export type AttachmentKind = "image" | "file" | "link";

export interface ThreadAttachment extends TimeStamped {
  id: ID;
  thread: ID; // сервер обычно присылает id
  kind: AttachmentKind;
  title: string;
  file: string | null;   // путь/URL, если kind=image|file
  url: string;           // если kind=link
}

/* ===================== Связь тема ↔ команда (через through) ===================== */

export type ThreadPublisherRole = "primary" | "partner" | "source" | "other";

export interface ThreadPublisherLink extends TimeStamped {
  id: ID;
  thread: ID;
  publisher: ID | TranslatorPublisher;
  role: ThreadPublisherRole;
  note: string;
}

/* ===================== Тема (Thread) ===================== */

export interface Thread extends TimeStamped {
  id: ID;

  category: ID | Category;
  kind: ID | ThreadKind;

  author: ID;                     // подробности автора фронту обычно не нужны в детале (ниже есть author_username)
  publish_as_team: ID | TranslatorPublisher | null;

  title: string;
  slug: string;
  content: string;

  anime: ID | KodikMaterial | null;
  manga: ID | Manga | null;

  poster: string | null;          // путь к файлу (если нужен)
  poster_url: string | null;      // удобный URL из @property
  extra?: ThreadExtra | string | null; // строка встречается, если сохранили невалидный JSON

  tags: ID[] | Tag[];

  comments_count: number;
  last_activity_at: DateTimeString;
  is_locked: boolean;
  is_pinned: boolean;

  // Денормализация, которую мы кладём в сериалайзере (удобно фронту)
  author_username?: string;
  author_avatar_url?: string | null;
  category_title?: string;

  manga_title?: string | null;
  anime_title?: string | null;
}

/** Элемент списка тем (облегчённый, без content, но с денорм.) */
export type ThreadListItem = Omit<Thread,
  | "content"
  | "attachments"
>;

/** Детальная тема (как в ThreadDetailSerializer) */
export interface ThreadDetail extends Thread {
  attachments?: ThreadAttachment[];
}

/* ===================== Комментарии ===================== */

export interface MiniProfile {
  avatar_url?: string | null;
  frame_url?: string | null;
}

export interface TeamShort {
  id: ID;
  name: string;
  slug: string;
  avatar_url?: string | null;
  frame_url?: string | null;
}

export interface CommentItem extends TimeStamped {
  id: ID;

  thread: ID;                           // список по thread
  author: ID;
  publish_as_team: ID | TranslatorPublisher | null;

  content: string;
  parent: ID | null;

  status: "published" | "pending" | "hidden";
  is_deleted: boolean;
  is_pinned: boolean;

  likes_count: number;
  replies_count: number;

  // денормализация (см. CommentSerializer)
  author_username?: string;
  author_profile?: MiniProfile | null;
  team?: TeamShort | null;
}

/* ===================== Пагинация DRF ===================== */

export interface DRFPage<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

/* ===================== Параметры запросов (удобные типы) ===================== */

export interface ThreadListQuery {
  // фильтры
  category?: string;        // id или slug
  kind?: string;            // id или slug
  thread_type?: "general" | "anime" | "manga" | "site"; // для обратной совместимости

  slug?: string;            // точное совпадение
  q?: string;               // поиск по title/slug/content

  // сортировка
  ordering?: "-created_at" | "created_at" | "-last_activity_at" | "last_activity_at" | "-is_pinned" | "is_pinned";

  // пагинация
  page?: number | string;
  page_size?: number | string;
}

export interface CommentListQuery {
  thread: ID | string;      // обязательный для списка
  parent?: "" | ID | string; // "" => корневые, id => ответы конкретного
  ordering?: "created_at" | "-created_at";
  page?: number | string;
  page_size?: number | string;
}

/* ===================== Утилиты ===================== */

/** Преобразует DRF ответ к простому массиву */
export function toArray<T>(data: DRFPage<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}
