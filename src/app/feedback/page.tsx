// src/app/feedback/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Обратная связь — Akimori",
  description: "Свяжитесь с нами через Telegram, Discord или бота Akimori",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Обратная связь
        </h1>

        <p className="mb-6 text-sm text-[color:var(--foreground)] opacity-70">
          Мы всегда рады вашим отзывам, предложениям и вопросам.  
          Выберите удобный способ связи ниже.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Telegram канал */}
          <SocialCard
            title="Telegram канал"
            description="Новости проекта и обновления"
            href="https://t.me/your_channel"
            label="Перейти в канал"
          />

          {/* Telegram бот */}
          <SocialCard
            title="Telegram бот"
            description="Быстрая связь и поддержка"
            href="https://t.me/your_bot"
            label="Открыть бота"
          />

          {/* Discord сервер */}
          <SocialCard
            title="Discord сервер"
            description="Сообщество, обсуждения и помощь"
            href="https://discord.gg/your_invite"
            label="Войти в Discord"
          />

          {/* Email (на будущее, можно убрать) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)] p-4">
            <div className="text-sm font-semibold">Email</div>
            <div className="mt-1 text-xs text-[color:var(--foreground)] opacity-70">
              support@akimori.kz
            </div>
            <a
              href="mailto:support@akimori.kz"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-foreground)] hover:opacity-95 transition"
            >
              Написать письмо
            </a>
          </div>
        </div>

        <div className="mt-8 text-xs text-[color:var(--foreground)] opacity-60">
          Мы стараемся отвечать как можно быстрее 💙
        </div>
      </div>
    </div>
  );
}

function SocialCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)] p-4 flex flex-col justify-between">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-[color:var(--foreground)] opacity-70">
          {description}
        </div>
      </div>

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs hover:bg-[color:var(--card)]/80 transition"
      >
        {label}
      </Link>
    </div>
  );
}
