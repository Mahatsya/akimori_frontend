// src/components/layout/SiteFooter.tsx
"use client";

import React from "react";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--border)] bg-[color:var(--background)]/70 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2l3.2 6.6L22 9.6l-5 4.9L18.4 22 12 18.6 5.6 22 7 14.5 2 9.6l6.8-1L12 2z"
                  />
                </svg>
              </span>
              <div className="font-semibold tracking-tight">Akimori</div>
            </div>

            <p className="mt-3 text-sm text-[color:var(--foreground)/0.7] leading-relaxed">
              Аниме-портал с каталогом, плеером и закладками. Добро пожаловать!
            </p>

            <div className="mt-4 flex items-center gap-2">
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
                href="/anime"
              >
                Перейти в каталог
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
                  <path fill="currentColor" d="M10 17l5-5-5-5v10z" />
                </svg>
              </a>

              <span className="text-xs text-[color:var(--foreground)/0.55]">
                Beta
              </span>
            </div>
          </div>

          <Col title="Разделы">
            <a href="/anime" className="foot-link">
              Каталог аниме
            </a>
            <a href="/manga" className="foot-link">
              Каталог манги
            </a>
            <a href="/forum" className="foot-link">
              Форум
            </a>
            <a href="/news" className="foot-link">
              Новости
            </a>
          </Col>

          <Col title="Помощь">
            <a href="/rules" className="foot-link">
              Правила
            </a>
            <a href="/feedback" className="foot-link">
              Обратная связь
            </a>
          </Col>

          <Col title="Юридическое">
            <a href="/terms" className="foot-link">
              Польз. соглашение
            </a>
            <a href="/privacy" className="foot-link">
              Конфиденциальность
            </a>
            <a href="/for-right-holders" className="foot-link">
              Для правообладателей
            </a>
          </Col>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/60 px-5 py-4 md:px-6 md:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[color:var(--foreground)/0.6]">
              © {new Date().getFullYear()} Akimori
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
                href="mailto:support@example.com"
              >
                contact@akimori.ru
              </a>

              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
              >
                Telegram
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
                  <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
                  <path fill="currentColor" d="M5 5h6v2H7v10h10v-4h2v6H5V5z" />
                </svg>
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
              >
                Discord
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
                  <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
                  <path fill="currentColor" d="M5 5h6v2H7v10h10v-4h2v6H5V5z" />
                </svg>
              </a>

              <a
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-foreground)] hover:opacity-95 transition"
                href="/feedback"
              >
                Написать нам
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* локальные стили ссылок футера */}
      <style jsx>{`
        .foot-link {
          display: inline-flex;
          width: fit-content;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: color-mix(in oklab, var(--secondary) 92%, transparent);
          color: color-mix(in oklab, var(--foreground) 78%, transparent);
          transition: all 160ms ease;
          font-size: 13px;
        }
        .foot-link:hover {
          background: color-mix(in oklab, var(--secondary) 80%, transparent);
          color: var(--foreground);
          border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
        }
      `}</style>
    </footer>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-80" />
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
