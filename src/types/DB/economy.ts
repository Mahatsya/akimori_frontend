// src/types/economy.ts

/** Базовые алиасы */
export type ID = number | string;
export type UUID = string;           // UUID v4
export type DateTimeString = string; // ISO 8601

/** ===== Валюта и масштабы хранения ===== */
export type Currency = "RUB" | "AKI";

/** Масштаб минорных единиц (как в бэке: SCALE) */
export const SCALE: Record<Currency, number> = {
  RUB: 100, // копейки
  AKI: 1,   // целые коины
};

/** ===== Кошелёк ===== */
export interface Wallet {
  id: ID;
  user: ID;                 // или User, если API популирует
  currency: Currency;
  balance: number;          // BigInt на бэке → число в минорных единицах
  created_at: DateTimeString;
  updated_at: DateTimeString;

  /** Необязательное поле, если бэк сериализует представление, как свойство */
  balance_display?: string; // напр. "123.45" для RUB
}

/** ===== Тип операции ===== */
export type TxType =
  | "deposit"
  | "withdraw"
  | "transfer_out"
  | "transfer_in"
  | "adjust";

/** ===== Транзакция ===== */
export interface Transaction {
  id: UUID;
  wallet: ID | Wallet;
  tx_type: TxType;
  amount: number;                 // > 0, в минорных единицах
  description: string;
  related_tx: UUID | Transaction | null; // парная строка для переводов
  idempotency_key: string | null;        // для защиты от дублей
  created_at: DateTimeString;
}

/** Популированные варианты (пример) */
export type TransactionPopulated = Omit<Transaction, "wallet" | "related_tx"> & {
  wallet: Wallet;
  related_tx: Transaction | null;
};

/** ===== Служебные типы сервиса ===== */
export interface TransferResult {
  out_tx: UUID | Transaction | null;
  in_tx: UUID | Transaction | null;
  amount: number; // в минорных единицах
}

/** Ошибка нехватки средств на уровне сервиса */
export type InsufficientFundsError = {
  name: "InsufficientFunds";
  message: string;
};

/** ===== Пагинация DRF (если используется) ===== */
export interface Page<T> {
  results: T[];
  count: number;
  page?: number;
  pages?: number;
}
