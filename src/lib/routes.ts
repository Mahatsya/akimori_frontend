// Единая точка генерации путей (UI и API)

export const ui = {
  materialPage: (slug: string) => `/anime/${encodeURIComponent(slug)}`,
};

export const api = {
  // BFF-роуты Next.js (не прямой вызов DRF)
  materialDetail: (slug: string) => `/api/materials/${encodeURIComponent(slug)}`,
};
