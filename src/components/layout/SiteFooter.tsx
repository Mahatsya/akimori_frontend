export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Col title="Akimori">
          <p className="text-white/70">
            Аниме-портал с каталогом, плеером и закладками. Добро пожаловать!
          </p>
        </Col>
        <Col title="Разделы">
          <a href="/anime" className="link">Каталог аниме</a>
          <a href="/manga" className="link">Каталог манги</a>
          <a href="/forum" className="link">Форум</a>
          <a href="/news" className="link">Новости</a>
        </Col>
        <Col title="Помощь">
          <a href="/rules" className="link">Правила</a>
          <a href="/feedback" className="link">Обратная связь</a>
        </Col>
        <Col title="Юридическое">
          <a href="/terms" className="link">Польз. соглашение</a>
          <a href="/privacy" className="link">Конфиденциальность</a>
        </Col>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between text-xs text-white/60">
          <div>© {new Date().getFullYear()} Akimori</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-white/80" href="mailto:support@example.com">support@example.com</a>
            <a className="hover:text-white/80" href="https://t.me/" target="_blank">Telegram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-white/90 font-semibold mb-2">{title}</div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
