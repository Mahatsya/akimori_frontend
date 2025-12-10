import type {
  Post,
  PostListResp,
  Category,
  Tag,
  PostCreatePayload,
  PostUpdatePayload,
} from "@/types/blog";

/** На сервере нужен абсолютный URL */
function toAbs(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") return url;
  const base =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return new URL(url, base).toString();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(toAbs(url), {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(init?.headers || {}),
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const text = await res.text();
  const data = isJson && text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail =
      (data as any)?.detail ||
      (isJson ? JSON.stringify(data) : text.slice(0, 400));
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return (data as T) ?? ({} as T);
}

/** Нормализация списков: array | {results: array} */
function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results)) {
    return (data as any).results as T[];
  }
  throw new Error("Unexpected list payload");
}

const BFF = {
  posts: "/api/proxy/blog/posts/",
  categories: "/api/proxy/blog/categories/",
  tags: "/api/proxy/blog/tags/",
};

export const BlogApi = {
  async list(params: Record<string, any> = {}): Promise<PostListResp> {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
      if (v != null && v !== "") sp.set(k, String(v));
    const qs = sp.toString();
    return fetchJson<PostListResp>(`${BFF.posts}${qs ? `?${qs}` : ""}`);
  },

  async get(slug: string): Promise<Post> {
    return fetchJson<Post>(`${BFF.posts}${encodeURIComponent(slug)}/`);
  },

  async create(payload: PostCreatePayload): Promise<Post> {
    return fetchJson<Post>(BFF.posts, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(slug: string, payload: PostUpdatePayload): Promise<Post> {
    return fetchJson<Post>(`${BFF.posts}${encodeURIComponent(slug)}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async categories(): Promise<Category[]> {
    const data = await fetchJson<unknown>(BFF.categories);
    return normalizeList<Category>(data);
  },

  async tags(): Promise<Tag[]> {
    const data = await fetchJson<unknown>(BFF.tags);
    return normalizeList<Tag>(data);
  },
};
