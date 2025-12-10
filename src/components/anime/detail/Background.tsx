// src/components/anime/detail/Background.tsx
"use client";
import Image from "next/image";

export default function Background({
  poster,
  title,
}: { poster: string | null; title: string }) {
  if (!poster) return null;

  return (
    <section
      aria-hidden
      className="
        relative w-full
        h-[26vh] sm:h-[52vh] lg:h-[58vh]
        overflow-hidden 
        -mb-[18vh]    /* 👈 увеличили перекрытие */
      "
    >
      <Image
        src={poster}
        alt={title}
        fill
        priority
        unoptimized
        sizes='100vw'
        className='object-cover object-[center_25%] scale-[1.08] pointer-events-none mask-b-soft blur-sm'  /* 👈 немного увеличили и размыли */
      />

      {/* затемнение сверху */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0) 0%, rgba(0,0,0,.3) 60%, rgba(0,0,0,.6) 100%)',
        }}
      />
      {/* плавный уход в фон */}
      <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[color:var(--background)]/98' />
      {/* сеточка */}
      <div className='absolute inset-0 opacity-[.06]
        [background:linear-gradient(to_right,rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.25)_1px,transparent_1px)]
        [background-size:40px_40px]' />
    </section>
  );
}
