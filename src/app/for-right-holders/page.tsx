// src/app/for-right-holders/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Для правообладателей — Akimori",
  description: "Информация для правообладателей контента на сайте Akimori.ru",
};

export default function RightHoldersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 p-6 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Для правообладателей
        </h1>

        <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-70 leading-relaxed">
          Деятельность интернет-ресурса <b>Akimori.ru</b> осуществляется в соответствии
          с применимым законодательством в области защиты информации и авторских прав.
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          <Section title="Общие положения">
            <p className="opacity-80">
              Akimori является информационно-каталожным ресурсом, посвящённым аниме и
              связанным материалам. Контент на сайте формируется автоматически на
              основе открытых источников, находящихся в свободном доступе в сети Интернет.
            </p>
            <p className="mt-2 opacity-80">
              Akimori не осуществляет хранение оригинальных медиафайлов (видео, аудио)
              на собственных серверах, а также не занимается их распространением.
              Все материалы предоставляются исключительно для ознакомительных целей.
            </p>
          </Section>

          <Section title="Авторские права">
            <p className="opacity-80">
              Публикация нелицензионного, похищенного либо иным образом незаконно
              размещённого контента не является целью ресурса Akimori.
            </p>
            <p className="mt-2 opacity-80">
              На сайте могут присутствовать фрагменты материалов, описания, обложки,
              кадры, а также пользовательские или любительские переводы, размещённые
              из открытых источников и предназначенные для ознакомительного просмотра.
            </p>
          </Section>

          <Section title="Сотрудничество с правообладателями">
            <p className="opacity-80">
              Администрация Akimori открыта к сотрудничеству с правообладателями.
              В случае подтверждённого нарушения исключительных прав, спорный материал
              будет удалён в кратчайшие сроки либо может быть рассмотрен вариант
              официального сотрудничества.
            </p>
          </Section>

          <Section title="Порядок обращения правообладателя">
            <p className="opacity-80">
              Если вы являетесь правообладателем либо официальным представителем и
              обнаружили на сайте Akimori материалы, нарушающие ваши авторские или
              смежные права, либо содержащие недостоверную информацию, пожалуйста,
              свяжитесь с Администрацией для урегулирования вопроса.
            </p>

            <p className="mt-3 opacity-80">
              Для рассмотрения обращения необходимо направить письмо с корпоративного
              почтового ящика, содержащее:
            </p>

            <ul className="mt-3 list-disc pl-5 space-y-1 opacity-80">
              <li>контактные данные и реквизиты правообладателя;</li>
              <li>прямую ссылку (или ссылки) на материал, считающийся спорным;</li>
              <li>
                сканированные копии документов, подтверждающих исключительные права
                на соответствующий контент;
              </li>
              <li>
                при обращении через представителя — документы, подтверждающие
                право представлять интересы правообладателя.
              </li>
            </ul>

            <p className="mt-3 opacity-80">
              Обращения принимаются по адресу электронной почты:
            </p>

            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-4 py-3 text-sm font-medium">
              abuse@akimori.ru
            </div>

            <p className="mt-3 opacity-80">
              Все обращения рассматриваются в разумные сроки. Администрация свяжется
              с заявителем для подтверждения информации и дальнейшего урегулирования.
            </p>
          </Section>

          <Section title="Разрешённые источники встраивания видео">
            <p className="opacity-80">
              На сайте могут использоваться официальные инструменты встраивания
              видеоконтента, предоставляемые сторонними платформами, включая:
            </p>

            <ul className="mt-3 list-disc pl-5 space-y-1 opacity-80">
              <li>YouTube.com</li>
              <li>OK.ru</li>
              <li>Rutube.ru</li>
            </ul>
          </Section>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
          >
            На главную
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
          >
            Пользовательское соглашение
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-foreground)] hover:opacity-95 transition"
          >
            Связаться с нами
          </Link>
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
