// src/types/kodik.ts

/** Базовые алиасы */
export type ID = number | string;
export type URLString = string;
export type DateString = string;      // 'YYYY-MM-DD'
export type DateTimeString = string;  // ISO 8601

/** ========== Translation ========== */
export type TranslationType = "voice" | "subtitles";

export interface Translation {
  id: ID;
  ext_id: number;
  title: string;
  type: TranslationType;
  slug: string;
  poster_url: URLString;
  avatar_url: URLString;
  banner_url: URLString;
  description: string;
  website_url: URLString;
  aliases: string[];
  country: ID | Country | null;
  founded_year: number | null;
}

/** ========== Country ========== */
export interface Country {
  id: ID;
  code: string; // ISO-2
  name: string;
  slug: string;
}

/** ========== Genre ========== */
export type GenreSource = "kp" | "shikimori" | "mdl" | "all";

export interface Genre {
  id: ID;
  name: string;
  source: GenreSource;
  slug: string; // уникален в паре (slug, source)
}

/** ========== Studio / LicenseOwner / MDLTag ========== */
export interface Studio {
  id: ID;
  name: string;
  slug: string;
}

export interface LicenseOwner {
  id: ID;
  name: string;
  slug: string;
}

export interface MDLTag {
  id: ID;
  name: string;
  slug: string;
}

/** ========== Person ========== */
export interface Person {
  id: ID;
  name: string;
  slug: string;
  avatar_url: URLString;
  photo_url: URLString;
  banner_url: URLString;
  bio: string;
  birth_date: DateString | null;
  death_date: DateString | null;
  country: ID | Country | null;
  imdb_id: string;
  shikimori_id: string;
  kinopoisk_id: string;
  socials: Record<string, string>;
}

/** ========== Material (базовый, списочный) ========== */
export type MaterialType =
  | "cartoon-serial"
  | "documentary-serial"
  | "russian-serial"
  | "foreign-serial"
  | "anime-serial"
  | "multi-part-film"
  | string;

export interface Material {
  kodik_id: string;
  slug: string;

  type: MaterialType;
  link: URLString;
  title: string;
  title_orig: string;
  other_title: string;

  translation: ID | Translation | null;

  year: number | null;
  quality: string;
  camrip: boolean | null;
  lgbt: boolean | null;

  kinopoisk_id: string;
  imdb_id: string;
  mdl_id: string;
  worldart_link: URLString;
  shikimori_id: string;

  created_at: DateTimeString;
  updated_at: DateTimeString;

  last_season: number | null;
  last_episode: number | null;
  episodes_count: number | null;

  blocked_countries: (ID | Country)[];
  production_countries: (ID | Country)[];

  genres: (ID | Genre)[];
  studios: (ID | Studio)[];
  license_owners: (ID | LicenseOwner)[];
  mdl_tags: (ID | MDLTag)[];

  screenshots: URLString[];
  poster_url: URLString;

  blocked_seasons: Record<string, boolean>;

  /** Вспомогательные флаги */
  is_serial?: boolean;
  is_movie?: boolean;

  /** 👇 Новые верхнеуровневые алиасы из детального ответа (опциональны для списка) */
  episodes_total?: number | null;
  episodes_aired?: number | null;
  next_episode_at?: DateTimeString | null;
}

/** ========== MaterialExtra ========== */
export type RatingBlock = {
  rating: number | null;
  votes: number | null;
};

export interface MaterialExtra {
  id: ID;
  material: string | Material;

  title: string;
  anime_title: string;
  title_en: string;

  other_titles: string[];
  other_titles_en: string[];
  other_titles_jp: string[];

  anime_license_name: string;
  anime_kind: string;

  all_status: string;
  anime_status: string;
  drama_status: string;

  tagline: string;
  description: string;
  anime_description: string;

  poster_url: URLString;
  anime_poster_url: URLString;
  drama_poster_url: URLString;

  duration: number | null;

  kinopoisk_rating: number | null;
  kinopoisk_votes: number | null;
  imdb_rating: number | null;
  imdb_votes: number | null;
  shikimori_rating: number | null;
  shikimori_votes: number | null;
  mydramalist_rating: number | null;
  mydramalist_votes: number | null;

  premiere_ru: DateString | null;
  premiere_world: DateString | null;
  aired_at: DateString | null;
  released_at: DateString | null;
  next_episode_at: DateTimeString | null;

  rating_mpaa: string;
  minimal_age: number | null;
  episodes_total: number | null;
  episodes_aired: number | null;
}

/** ========== MaterialVersion / Season / Episode ========== */
export interface MaterialVersion {
  id: ID;
  material: string | Material;
  translation: ID | Translation;
  movie_link: URLString;
}

export interface Season {
  id: ID;
  version: ID | MaterialVersion;
  number: number;
  link: URLString;
}

export interface Episode {
  id: ID;
  season: ID | Season;
  number: number;
  link: URLString;
  title: string;
  screenshots: URLString[];
}

/** ========== Credit ========== */
export type CreditRole =
  | "actor"
  | "director"
  | "producer"
  | "writer"
  | "composer"
  | "editor"
  | "designer"
  | "operator";

export interface Credit {
  id: ID;
  material: string | Material;
  person: ID | Person;
  role: CreditRole;
  character_name: string;
  order: number;
  note: string;
}

/** ======== Populated helpers ======== */
export type WithPopulated<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]> extends (infer U)[]
    ? U extends ID
      ? Exclude<T[P], ID>[]
      : T[P]
    : NonNullable<T[P]> extends ID
    ? Exclude<T[P], ID>
    : T[P];
};

export type MaterialPopulated = WithPopulated<
  WithPopulated<
    WithPopulated<
      WithPopulated<WithPopulated<Material, "genres">, "production_countries">,
      "blocked_countries"
    >,
    "studios"
  >,
  "license_owners"
>;

export type CreditPopulated = WithPopulated<Credit, "person">;
export type MaterialVersionPopulated = WithPopulated<MaterialVersion, "translation">;

/** ========== MaterialDetail (детальная карточка) ========== */
export interface MaterialDetail extends Material {
  // сервер на детальной отдаёт extra/versions/credits и т.п.
  extra: MaterialExtra | null;
  versions: (MaterialVersion | MaterialVersionPopulated)[];
  credits: (Credit | CreditPopulated)[];
  license_owners: (ID | LicenseOwner)[];
  mdl_tags: (ID | MDLTag)[];

  // алиасы (на случай, если пришли только в extra, но мы пробрасываем их наверх)
  episodes_total?: number | null;
  episodes_aired?: number | null;
  next_episode_at?: DateTimeString | null;
}

export type MaterialDetailPopulated = WithPopulated<
  WithPopulated<WithPopulated<MaterialDetail, "versions">, "credits">,
  "license_owners"
>;
