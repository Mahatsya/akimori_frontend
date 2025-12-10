// src/components/home/SliderRow.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  id?: string;
  title: string;
  hrefMore?: string;
  children: ReactNode;
};

export default function SliderRow({ id, title, hrefMore, children }: Props) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {hrefMore && (
          <Link
            href={hrefMore}
            className="text-xs md:text-sm rounded-full border border-[var(--border)] px-3 py-1.5 opacity-80 hover:opacity-100 hover:bg-[var(--secondary)]"
          >
            Смотреть всё
          </Link>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.25 }}
        className="relative"
      >
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory thin-scroll">
          {children}
        </div>
      </motion.div>
    </section>
  );
}
