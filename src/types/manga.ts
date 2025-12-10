export type Category = { slug: string; title: string };
export type Genre = { slug: string; title: string };

export type Translator = {
  id: number | string;
  slug: string;
  name: string;
  avatar_url?: string | null;
  description?: string | null;
  manga_count?: number | null;
  followers_count?: number | null;
};

export type Chapter = {
  id: number | string;
  edition: number | string;
  number: string | number;
  name?: string | null;
  volume?: number | null;
  pages_count?: number | null;
  published_at?: string | null;
};

export type Edition = {
  id: number | string;
  translation_status?: string | null;
  translator?: Translator | null;
  chapters?: Chapter[] | null;
};

export type MangaLite = {
  id: number | string;
  slug: string;
  title_ru: string;
  title_en?: string | null;
  alt_titles?: string[] | null;
  type: "manga" | "manhwa" | "manhua" | "one-shot" | "doujinshi" | "other";
  age_rating?: string | null;
  year?: number | null;
  poster_url?: string | null;
  banner_url?: string | null;
  work_status: "ongoing" | "completed" | "hiatus" | "frozen" | "announced";
  categories: Category[];
  genres: Genre[];
};

export type MangaDetail = MangaLite & {
  description?: string | null;
  links?: { title?: string | null; url: string }[] | null;
  editions: Edition[];
};
