// src/app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Политика конфиденциальности — Akimori",
  description: "Политика конфиденциальности и обработки персональных данных Akimori.ru",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 p-6 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Политика конфиденциальности
        </h1>

        <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-70 leading-relaxed">
          Настоящая Политика конфиденциальности определяет порядок сбора, хранения,
          обработки и защиты информации о пользователях интернет-ресурса{" "}
          <b>Akimori.ru</b> (далее — «Ресурс»).
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          <Section title="1. Общие положения">
            <p className="opacity-80">
              Используя Ресурс, вы подтверждаете согласие с настоящей Политикой
              конфиденциальности. Если вы не согласны с условиями, пожалуйста,
              прекратите использование Ресурса.
            </p>
            <p className="mt-2 opacity-80">
              Администрация Akimori вправе изменять Политику конфиденциальности без
              предварительного уведомления. Новая редакция вступает в силу по
              истечении 3 (трёх) дней с момента её публикации на странице{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                Akimori.ru/privacy
              </Link>
              .
            </p>
          </Section>

          <Section title="2. Состав собираемой информации">
            <p className="opacity-80">
              Ресурс может собирать следующую информацию о пользователях:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1 opacity-80">
              <li>данные, предоставляемые пользователем при регистрации (логин, имя, аватар и др.);</li>
              <li>технические данные (IP-адрес, cookies, тип браузера, устройство);</li>
              <li>данные активности на сайте (история просмотров, закладки, комментарии);</li>
              <li>сообщения, направленные пользователем через формы обратной связи или бота.</li>
            </ul>
          </Section>

          <Section title="3. Использование информации">
            <p className="opacity-80">
              Собранная информация используется исключительно для:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1 opacity-80">
              <li>обеспечения корректной работы Ресурса;</li>
              <li>персонализации пользовательского опыта;</li>
              <li>обратной связи и технической поддержки;</li>
              <li>улучшения качества сервиса и функциональности.</li>
            </ul>
          </Section>

          <Section title="4. Передача информации третьим лицам">
            <p className="opacity-80">
              Администрация Akimori не передаёт персональные данные пользователей
              третьим лицам, за исключением случаев:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1 opacity-80">
              <li>требований действующего законодательства;</li>
              <li>официальных запросов уполномоченных государственных органов;</li>
              <li>необходимости защиты прав и законных интересов Ресурса.</li>
            </ul>
          </Section>

          <Section title="5. Хранение и защита данных">
            <p className="opacity-80">
              Администрация принимает разумные организационные и технические меры
              для защиты персональных данных пользователей от утраты, неправомерного
              доступа, изменения или уничтожения.
            </p>
            <p className="mt-2 opacity-80">
              При этом пользователь понимает, что ни один способ передачи данных
              через Интернет не может быть абсолютно безопасным.
            </p>
          </Section>

          <Section title="6. Ответственность пользователя">
            <p className="opacity-80">
              Пользователь обязуется не передавать третьим лицам свои данные для
              входа (логин, пароль, токены доступа) и несёт полную ответственность
              за последствия их утраты или передачи.
            </p>
          </Section>

          <Section title="7. Использование файлов cookie">
            <p className="opacity-80">
              Ресурс использует файлы cookie и аналогичные технологии для
              обеспечения корректной работы, аналитики и улучшения пользовательского
              опыта. Пользователь может изменить настройки cookie в своём браузере.
            </p>
          </Section>

          <Section title="8. Заключительные положения">
            <p className="opacity-80">
              Настоящая Политика конфиденциальности применяется совместно с{" "}
              <Link href="/terms" className="underline underline-offset-4">
                Пользовательским соглашением
              </Link>
              .
            </p>
            <p className="mt-2 opacity-80">
              По всем вопросам, связанным с обработкой персональных данных,
              пользователь может обратиться через страницу{" "}
              <Link href="/feedback" className="underline underline-offset-4">
                Обратной связи
              </Link>
              .
            </p>
          </Section>
        </div>

        <div className="mt-6 text-xs text-[color:var(--foreground)] opacity-55">
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--background)]/40 p-5 md:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
