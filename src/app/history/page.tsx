"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function AiPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] overflow-hidden">

      {/* фон */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-[var(--background)] to-[var(--background)]" />
      </div>

      {/* контент */}
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

        <h1 className="text-4xl font-extrabold mb-3">
          Раздел в разработке
        </h1>

        <p className="opacity-80 mb-6 text-base">
          Мы уже работаем над этим разделом.  
          Скоро здесь появится новый функционал.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--secondary)] transition"
          >
            На главную
          </Link>
          <Link
            href="/forum"
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--secondary)] transition"
          >
            Форум
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
