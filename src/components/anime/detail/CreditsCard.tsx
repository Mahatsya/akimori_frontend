import { SoftCard, Tag } from "./atoms";
import type { Credit, Person } from "@/types/DB/kodik";

/** type guard: сузить person c ID | Person до Person */
function isPerson(p: Credit["person"]): p is Person {
  return typeof p === "object" && p !== null && "slug" in p && "name" in p;
}

/** Отбор людей по ролям */
function byRoles(credits: Credit[], roles: string[], limit = 6) {
  const set = new Set(roles.map((r) => r.toLowerCase()));
  return (credits || [])
    .filter((c) => set.has(c.role.toLowerCase()))
    .slice(0, limit);
}

export default function CreditsCard({ credits }: { credits: Credit[] }) {
  const directors = byRoles(credits, ["director", "режиссёр", "режиссер"]);
  const writers = byRoles(credits, ["writer", "screenwriter", "сценарист"]);
  const voices = byRoles(credits, ["voice", "озвучка", "voice acting", "озвучивание"]);

  if (!directors.length && !writers.length && !voices.length) return null;

  return (
    <SoftCard className="p-4">
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        {/* Режиссёры */}
        {directors.length ? (
          <div>
            <div className="text-[color:var(--foreground)/0.8] font-semibold mb-1">
              Режиссёр(ы)
            </div>
            <div className="flex flex-wrap gap-2">
              {directors.map((c) => {
                if (!isPerson(c.person)) return null;
                return (
                  <Tag key={c.id ?? `dir-${c.person.slug}`}>
                    {c.person.name}
                  </Tag>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Сценаристы */}
        {writers.length ? (
          <div>
            <div className="text-[color:var(--foreground)/0.8] font-semibold mb-1">
              Сценарий
            </div>
            <div className="flex flex-wrap gap-2">
              {writers.map((c) => {
                if (!isPerson(c.person)) return null;
                return (
                  <Tag key={c.id ?? `wr-${c.person.slug}`}>
                    {c.person.name}
                  </Tag>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Озвучка */}
        {voices.length ? (
          <div>
            <div className="text-[color:var(--foreground)/0.8] font-semibold mb-1">
              Озвучивание
            </div>
            <div className="flex flex-wrap gap-2">
              {voices.map((c) => {
                if (!isPerson(c.person)) return null;
                return (
                  <Tag key={c.id ?? `vc-${c.person.slug}`}>
                    {c.person.name}
                  </Tag>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </SoftCard>
  );
}
