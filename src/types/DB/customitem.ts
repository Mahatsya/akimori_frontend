// src/types/customitem.ts

/** Базовые алиасы */
export type ID = number | string;
export type DateTimeString = string;
export type URLString = string;

/** ===== Enum’ы из Django ===== */
export type ItemType =
  | "avatar_static"
  | "avatar_anim"
  | "header_anim"
  | "theme"
  | "avatar_frame";

export type Rarity = "common" | "rare" | "epic" | "legend";

export type InventorySource = "purchase" | "gift" | "achieve";

/** ===== Предмет каталога ===== */
export interface Item {
  id: ID;
  type: ItemType;
  slug: string;
  title: string;
  description: string;

  // Медиа (одно из двух: file или file_url) + превью
  file: URLString | null;        // путь/URL до загруженного файла (как сериализует DRF)
  file_url: URLString | null;    // внешний URL
  preview: URLString | null;     // превью-картинка

  is_animated: boolean;
  mime: string;                  // например: "image/webp", "video/webm"
  width: number | null;
  height: number | null;
  duration_ms: number | null;

  rarity: Rarity;
  attributes: Record<string, unknown>; // произвольные параметры темы/цвета и т.п.

  // Цена и лимиты
  price_aki: number;             // целые AKI
  limited_total: number | null;
  limited_sold: number;

  is_active: boolean;

  created_at: DateTimeString;
  updated_at: DateTimeString;

  /** Удобный флаг, если API добавляет computed-свойство (см. модель) */
  can_sell_now?: boolean;
}

/** ===== Инвентарь (владение предметом) ===== */
export interface Inventory {
  id: ID;
  user: ID;                  // или User при популяции
  item: ID | Item;
  source: InventorySource;
  note: string;
  acquired_at: DateTimeString;
}

/** ===== Надетые предметы пользователя ===== */
export interface AppliedCustomization {
  id: ID;
  user: ID;                  // или User
  avatar_item: ID | Item | null;
  header_item: ID | Item | null;
  theme_item: ID | Item | null;
  frame_item: ID | Item | null;
  updated_at: DateTimeString;
}

/** ===== Пагинация DRF (если используется) ===== */
export interface Page<T> {
  results: T[];
  count: number;
  page?: number;
  pages?: number;
}

/** ===== Варианты с «популяциями» (id → объект) ===== */
export type InventoryPopulated = Omit<Inventory, "item" | "user"> & {
  item: Item;
  user: ID; // замените на тип User, если используете его интерфейс
};

export type AppliedCustomizationPopulated = Omit<
  AppliedCustomization,
  "avatar_item" | "header_item" | "theme_item" | "frame_item" | "user"
> & {
  user: ID; // или User
  avatar_item: Item | null;
  header_item: Item | null;
  theme_item: Item | null;
  frame_item: Item | null;
};
