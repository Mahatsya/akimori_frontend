export type ChapterPage = {
  id: number | string;
  order: number;
  // любые возможные поля с урлом картинки — нормализуем на фронте
  image?: string;
  image_url?: string;
  url?: string;
};

export type ChapterDetail = {
  id: number | string;
  number: string;
  name?: string | null;
  volume?: number | null;
  pages_count?: number | null;
  published_at?: string | null;
  edition?: number | { id: number | string; translator?: any; manga?: any };
  // иногда бэкенд отдаёт страницы сразу
  pages?: ChapterPage[];
  chapter_pages?: ChapterPage[];
  images?: ChapterPage[];
};
