// src/types/manga.ts

/** Базовые алиасы */
export type ID = number | string;
export type DateTimeString = string; // ISO 8601
export type URLString = string;

/** ===== Общие миксины ===== */
export interface TimeStamped {
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/** ===== Категории / Жанры ===== */
export interface Category extends TimeStamped {
  id: ID;
  title: string;
  slug: string;
}

export interface Genre extends TimeStamped {
  id: ID;
  title: string;
  slug: string;
}

/** ===== Группа переводчиков / паблишер ===== */
export interface TranslatorPublisher extends TimeStamped {
  id: ID;
  name: string;
  slug: string;
  avatar_url: URLString | null;
  description: string | null;

  followers_count: number;
  manga_count: number;

  // Обычно members не инлайнится — через отдельные эндпоинты
}

export type TranslatorRole = "owner" | "moderator" | "publisher" | "member";

export interface TranslatorMember extends TimeStamped {
  id: ID;
  translator: ID | TranslatorPublisher;
  user: ID; // или User, если популяция
  role: TranslatorRole;
  title: string | null;  // подпись в команде (верстальщик, редактор и т.д.)
  is_active: boolean;

  /** Удобные флаги, если бек их добавит */
  can_moderate?: boolean;
  can_publish?: boolean;
}

/** ===== Манга ===== */
export type MangaType =
  | "manga"
  | "manhwa"
  | "manhua"
  | "one-shot"
  | "doujinshi"
  | "other";

export type WorkStatus = "ongoing" | "completed" | "hiatus" | "frozen" | "announced";

export interface LinkItem {
  title: string;
  url: URLString;
}

export interface Manga extends TimeStamped {
  id: ID;
  title_ru: string;
  title_en: string | null;
  alt_titles: string[]; // список строк
  slug: string;

  type: MangaType;
  age_rating: "0+" | "6+" | "12+" | "16+" | "18+" | null;
  year: number | null;

  poster_url: URLString | null;
  banner_url: URLString | null;
  description: string | null;

  work_status: WorkStatus;

  // связи — бек может отдавать массив id либо объектов
  categories: (ID | Category)[];
  genres: (ID | Genre)[];

  links: LinkItem[];
}

/** Вариант с «популяциями» (если API разворачивает связи в объекты) */
export type MangaPopulated = Omit<Manga, "categories" | "genres"> & {
  categories: Category[];
  genres: Genre[];
};

/** ===== Издание (конкретный переводчик для манги) ===== */
export type TranslationStatus = "in_progress" | "completed" | "dropped";

export interface Edition extends TimeStamped {
  id: ID;
  manga: ID | Manga;
  translator: ID | TranslatorPublisher;
  translation_status: TranslationStatus;
}

/** ===== Глава ===== */
export interface Chapter extends TimeStamped {
  id: ID;
  edition: ID | Edition;

  /** DecimalField(5,2) в бэке: храним как строку, чтобы не терять 1.5/2.5 и точность */
  number: string;

  name: string | null;
  volume: number | null;
  pages_count: number | null;

  published_at: DateTimeString;

  uploaded_by: ID | null; // либо User, если популяция
}

/** ===== Страница главы ===== */
export type ChapterImageType = "page";

export interface ChapterPage extends TimeStamped {
  id: ID;
  chapter: ID | Chapter;
  image: URLString; // путь/URL, зависит от сериализации DRF
  order: number;
  type: ChapterImageType;

  uploaded_by: ID | null; // либо User
}

/** ===== Пагинация DRF (если используется) ===== */
export interface Page<T> {
  results: T[];
  count: number;
  page?: number;
  pages?: number;
}

/** Утилита для «популированных» вариантов */
export type WithPopulated<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]> extends (infer U)[]
    ? U extends ID
      ? Exclude<T[P], ID>[] // массив объектов вместо id[]
      : T[P]
    : NonNullable<T[P]> extends ID
    ? Exclude<T[P], ID>     // объект вместо id
    : T[P];
};

// Примеры:
// export type EditionPopulated = WithPopulated<WithPopulated<Edition, "manga">, "translator">;
// export type ChapterPopulated = WithPopulated<Chapter, "edition">;
// export type ChapterPagePopulated = WithPopulated<ChapterPage, "chapter">;
