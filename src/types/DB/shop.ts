// src/types/shop.ts

// Общие алиасы
export type ID = number | string;
export type DateTimeString = string; // ISO 8601

/** ====== Связанные сущности (минимально) ====== */
export interface Item {
  id: ID;
  slug: string;
  title: string;
  type: string; // frame / avatar / badge / etc.
  rarity: string; // common / rare / epic / ...
  is_animated: boolean;
  mime: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  price_aki: number; // базовая цена предмета
  limited_total: number | null;
  limited_sold: number | null;
  preview_url: string | null; // абсолютный URL
  can_sell_now?: boolean; // как в бэке (используется в Offer.is_selling_now)
}

export interface Transaction {
  id: ID;
  amount: number; // в AKI
  currency: "AKI";
  note?: string;
  created_at?: DateTimeString;
}

/** ====== Offer ====== */
export interface Offer {
  id: ID;
  item: ID | Item;

  is_active: boolean;
  /** Если задана — заменяет Item.price_aki */
  price_override_aki: number | null;

  starts_at: DateTimeString | null;
  ends_at: DateTimeString | null;

  created_at: DateTimeString;
  updated_at: DateTimeString;

  /** Рассчитывается на сервере: Offer.current_price (property) */
  current_price: number;

  /** Часто сериализуют как selling_now по методу is_selling_now() */
  selling_now?: boolean;
}

/** ====== Purchase ====== */
export type PurchaseStatus = "success" | "failed";

export interface Purchase {
  id: ID;

  user: ID; // или User, если популяция
  item: ID | Item;
  price_aki: number;

  transaction: ID | Transaction;

  status: PurchaseStatus; // "success" | "failed"
  created_at: DateTimeString;
}

/** ====== Вспомогательные типы (если API пагинирует) ====== */
export interface Page<T> {
  results: T[];
  count: number;
  page?: number;
  pages?: number;
}

/** ====== Инвентарь пользователя ====== */

/**
 * Одна запись инвентаря:
 * - id — id записи инвентаря
 * - item — сам предмет (как в магазине)
 */
export interface InventoryEntry {
  id: ID;
  item: Item;
  acquired_at?: DateTimeString;
  expires_at?: DateTimeString | null;
}

/**
 * Применённые кастомизации у пользователя:
 * - avatar_item — выбранный аватар
 * - header_item — выбранная шапка
 * - theme_item — выбранная тема
 */
export interface AppliedCustomization {
  id?: ID;
  avatar_item: Item | null;
  header_item: Item | null;
  theme_item: Item | null;
  updated_at?: DateTimeString;
}
