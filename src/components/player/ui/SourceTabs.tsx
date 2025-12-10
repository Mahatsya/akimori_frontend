"use client";

import React from "react";
import { MdOndemandVideo } from "react-icons/md";
import { TbBrandAirtable } from "react-icons/tb";

export function SourceTabs({
  tab,
  setTab,
  autonext,
  setAutonext,
}: {
  tab: "iframe" | "direct";
  setTab: (t: "iframe" | "direct") => void;
  autonext: boolean;
  setAutonext: (v: boolean) => void;
}) {
  const pill = (active: boolean) =>
    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition " +
    (active
      ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
      : "bg-[color:var(--secondary)]/70 text-[color:var(--foreground)/0.95] border-[var(--border)] hover:bg-[color:var(--secondary)]");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 border-b border-[var(--border)] bg-[color:var(--secondary)]/55 backdrop-blur-md">
      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={() => setTab("direct")}
          className={pill(tab === "direct")}
          title="Прямая ссылка Akimori (2)"
        >
          <TbBrandAirtable className="text-base" />
          <span className="xs:inline">Akimori 4K</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("iframe")}
          className={pill(tab === "iframe")}
          title="Официальный iframe (1)"
        >
          <MdOndemandVideo className="text-base" />
          <span className="xs:inline">Kodik</span>
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)/0.9]">
        <input
          type="checkbox"
          className="rounded border-[var(--border)] bg-[color:var(--secondary)] focus:ring-[var(--accent)]"
          checked={autonext}
          onChange={(e) => setAutonext(e.target.checked)}
        />
        Автоследующая серия
      </label>
    </div>
  );
}
