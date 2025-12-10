// src/app/user/settings/page.tsx
import { Suspense } from "react";
import UserSettingsClient from "./UserSettingsClient";

// опционально, чтобы не пытался статически пререндерить
export const dynamic = "force-dynamic";

export default function UserSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          <div className="h-8 w-40 rounded-full bg-[color:var(--secondary)] animate-pulse mb-4" />
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
            <div className="space-y-4">
              <div className="h-52 rounded-2xl bg-[color:var(--secondary)] animate-pulse" />
              <div className="h-24 rounded-2xl bg-[color:var(--secondary)] animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-10 rounded-2xl bg-[color:var(--secondary)] animate-pulse" />
              <div className="h-80 rounded-2xl bg-[color:var(--secondary)] animate-pulse" />
            </div>
          </div>
        </main>
      }
    >
      <UserSettingsClient />
    </Suspense>
  );
}
