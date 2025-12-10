// src/lib/schemas.ts
import { z } from "zod";

/* -----------------------------------------
 * Общие типы
 * ----------------------------------------- */
export const SlugZ = z.string().min(1).regex(/^[-a-z0-9]+$/);

/* -----------------------------------------
 * MaterialExtra (аннотация + аггрегаты)
 * ----------------------------------------- */
export const MaterialExtraZ = z.object({
  title: z.string().optional(),
  anime_title: z.string().optional(),
  title_en: z.string().optional(),

  poster_url: z.string().url().optional(),
  anime_poster_url: z.string().url().optional(),
  drama_poster_url: z.string().url().optional(),

  shikimori_rating: z.number().nullable().optional(),
  shikimori_votes: z.number().optional(),

  kinopoisk_rating: z.number().nullable().optional(),
  imdb_rating: z.number().nullable().optional(),

  aired_at: z.string().nullable().optional(),
  premiere_world: z.string().nullable().optional(),
  released_at: z.string().nullable().optional(),

  aki_rating: z.number().nullable().optional(),
  aki_votes: z.number().optional(),
  comments_count: z.number().optional(),

  views_count: z.number().optional(), // ← важно
}).partial();

/* -----------------------------------------
 * Material list item
 * ----------------------------------------- */
export const MaterialListItemZ = z.object({
  slug: SlugZ,
  title: z.string(),
  title_orig: z.string().optional(),
  type: z.string().optional(),
  poster_url: z.string().url().optional(),
  year: z.number().int().nullable().optional(),

  // главная страница использует это
  shikimori_rating: z.number().nullable().optional(),
});

/* -----------------------------------------
 * Episode
 * ----------------------------------------- */
export const EpisodeZ = z.object({
  id: z.number().int(),
  number: z.number().int(),
  link: z.string().url(),
  title: z.string().optional(),
});

/* -----------------------------------------
 * Season
 * ----------------------------------------- */
export const SeasonZ = z.object({
  id: z.number().int(),
  number: z.number().int(),
  link: z.string().url().optional(),
  episodes: z.array(EpisodeZ).optional(),
});

/* -----------------------------------------
 * Version (translation)
 * ----------------------------------------- */
export const VersionZ = z.object({
  id: z.number().int(),
  translation: z.any().optional(), // можно сделать строгим, если дашь структуру
  movie_link: z.string().url().nullable().optional(),
  seasons: z.array(SeasonZ).optional(),
});

/* -----------------------------------------
 * Полный материал
 * ----------------------------------------- */
export const MaterialDetailZ = MaterialListItemZ.extend({
  kodik_id: z.string().optional(),
  extra: MaterialExtraZ.optional(),

  genres: z.array(z.string()).optional(),
  studios: z.array(z.string()).optional(),
  production_countries: z.array(z.string()).optional(),

  versions: z.array(VersionZ).optional(),
});
