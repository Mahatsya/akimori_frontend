export type Id = number;

export type AuthorShort = {
  id: Id;
  username: string;
  display_name?: string | null;
};

export type Category = {
  id: Id;
  slug: string;
  name: string;
  posts_count?: number;
};

export type Tag = {
  id: Id;
  slug: string;
  name: string;
  posts_count?: number;
};

export type Post = {
  id: Id;
  slug: string;
  title: string;
  excerpt: string;
  content_html?: string | null;
  poster?: string | null;
  pinned: boolean;
  is_closed: boolean;
  status: "draft" | "published" | "archived";
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: AuthorShort | null;
  categories: Category[];
  tags: Tag[];
};

export type PostListResp = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Omit<Post, "content_html">[];
};

/** Поля, которые принимает DRF на запись */
export type PostWritableFields = {
  title: string;
  excerpt?: string;
  content_html?: string;
  status?: "draft" | "published" | "archived";
  pinned?: boolean;
  is_closed?: boolean;
  category_ids?: number[];
  tag_ids?: number[];
};
export type PostCreatePayload = PostWritableFields;
export type PostUpdatePayload = Partial<PostWritableFields>;
