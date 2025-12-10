// src/components/home/GenreNav.tsx
"use client";

type GenreLink = {
  id: string;   // id секции на странице (например "genre-isekai")
  label: string;
};

export default function GenreNav({ items }: { items: GenreLink[] }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto thin-scroll pb-1">
      {items.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => handleClick(g.id)}
          className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[color:var(--secondary)]/60 px-3.5 py-1.5 text-xs md:text-sm opacity-80 hover:opacity-100 hover:border-[var(--accent)]/70 transition"
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
