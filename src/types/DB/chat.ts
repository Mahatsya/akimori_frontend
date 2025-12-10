// src/types/chat.ts

/** Базовые алиасы */
export type ID = number | string;
export type UUID = string;            // conversation.id — UUID v4
export type DateTimeString = string;  // ISO 8601

/** Обобщённая пагинация DRF */
export interface Page<T> {
  results: T[];
  count: number;
  page?: number;
  pages?: number;
}

/** Минимальный юзер (совместимо с твоими AnyUser/Users) */
export interface ChatUser {
  id: ID;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
}

/** Участник чата (through-модель Participant) */
export interface Participant {
  id: ID;
  conversation: UUID | Conversation;
  user: ID | ChatUser;
  joined_at: DateTimeString;
  is_admin: boolean;
}

/** Диалог/групповой чат */
export interface Conversation {
  id: UUID;
  title: string;
  created_at: DateTimeString;
  updated_at: DateTimeString;

  // M2M participants через through-модель:
  participants: (ID | ChatUser)[]; // сервер может отдавать id’шники или облегчённые объекты
}

/** Сообщение */
export interface Message {
  id: ID;
  conversation: UUID | Conversation;
  sender: ID | ChatUser;
  text: string;
  created_at: DateTimeString;
  edited_at: DateTimeString | null;

  // M2M «прочитано пользователем»
  read_by: (ID | ChatUser)[];
}

/** ===== Варианты с «популяциями» (id → объект) ===== */
export type ParticipantPopulated = Omit<Participant, "conversation" | "user"> & {
  conversation: Conversation;
  user: ChatUser;
};

export type ConversationPopulated = Omit<Conversation, "participants"> & {
  participants: ChatUser[];
};

export type MessagePopulated = Omit<Message, "conversation" | "sender" | "read_by"> & {
  conversation: Conversation;
  sender: ChatUser;
  read_by: ChatUser[];
};

/** ===== DTO/утилиты (по желанию) ===== */

/** Создание/открытие приватного диалога */
export interface CreateOrOpenConversationDto {
  user_id: ID;
}

/** Отправка сообщения */
export interface SendMessageDto {
  text: string;
}

/** История сообщений (твоя сигнатура на фронте) */
export interface MessageHistoryResponse {
  results: Message[];
  page: number;
  pages: number;
  count: number;
}


// компактный пользователь для листинга
export type CompactUser = { id: number | string; username?: string; display_name?: string };

// элемент списка бесед (то, что реально нужно в сайдбаре)
export interface ConversationListItem extends Omit<Conversation, "participants"> {
  // участники могут быть id’шниками ИЛИ объектами – делаем универсально
  participants?: (number | string | CompactUser)[];

  // денормализованные поля, если сервер их отдаёт
  unread_count?: number;
  last_message_preview?: string;
}
