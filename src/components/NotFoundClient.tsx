// src/components/NotFoundClient.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function NotFoundClient() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] overflow-hidden">

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-[var(--background)] to-[var(--background)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-2xl mx-auto p-6"
      >
        <Image
          src="/logo.png"
          alt="Akimori"
          width={96}
          height={96}
          className="mx-auto mb-4"
        />

        <h1 className="text-4xl font-extrabold mb-2">
          404 — Страница не найдена
        </h1>

        <p className="opacity-80 mb-6">
          Такой страницы не существует или она была удалена.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/" className="underline">На главную</Link>
          <Link href="/forum" className="underline">Форум</Link>
        </div>
      </motion.div>
    </main>
  );
}
