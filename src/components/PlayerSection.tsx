// src/components/player/PlayerSection.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { pickLink, trName } from "@/components/player/utils";
import { SoftCard } from "@/components/player/ui/SoftCard";
import { SourceTabs } from "@/components/player/ui/SourceTabs";
import { VersionList } from "@/components/player/VersionList";
import { SeasonSwitcher } from "@/components/player/SeasonSwitcher";
import { EpisodeFilters } from "@/components/player/EpisodeFilters";
import { EpisodeGrid } from "@/components/player/EpisodeGrid";
import { VideoArea } from "@/components/player/VideoArea";
import { parseKodik, type KodikResponse } from "@/components/player/kodikParser";

export type Episode = {
  id: number;
  number: number;
  title?: string;
  link?: string;
  iframe?: string;
  iframe_src?: string;
  url?: string;
  screenshots?: string[];
};
export type Season = { id: number; number: number; episodes: Episode[] };
export type Version = {
  id: number;
  translation?:
    | {
        id: number;
        title?: string;
        name?: string;
        type?: "voice" | "subtitles";
        slug?: string;
      }
    | null;
  seasons: Season[];
};

export default function PlayerSection({
  versions,
  initialLink = "",
  storageKey,
}: {
  versions: Version[];
  initialLink?: string;
  storageKey?: string; // лучше slug материала
}) {
  const storeKey = storageKey ? `player:${storageKey}` : undefined;

  // безопасно получаем базу API для браузера
  const getApiBase = () => {
    const raw =
      (process.env.NEXT_PUBLIC_API_BASE as string | undefined) ||
      (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");
    return raw.replace(/\/+$/, "");
  };
  const apiBase = getApiBase();

  const norm = (u: string) => (u?.startsWith("//") ? "https:" + u : u);

  // сортировка переводов (А-Я)
  const orderedVersions = useMemo(
    () => [...(versions || [])].sort((a, b) => trName(a).localeCompare(trName(b), "ru")),
    [versions]
  );

  // выбранный перевод / сезон / серия
  const [vIdx, setVIdx] = useState(0);
  const seasons = useMemo(
    () => (orderedVersions[vIdx]?.seasons || []).slice().sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [orderedVersions, vIdx]
  );
  const [sIdx, setSIdx] = useState(0);
  const episodes = useMemo(
    () => (seasons[sIdx]?.episodes || []).slice().sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [seasons, sIdx]
  );

  // состояние плеера
  const [tab, setTab] = useState<"iframe" | "direct">("direct");
  const [currentEpIdx, setCurrentEpIdx] = useState(0);
  const [link, setLink] = useState<string>(initialLink);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [directKind, setDirectKind] = useState<"hls" | "mp4" | "unknown">("unknown");
  const [qualities, setQualities] = useState<Array<{ label: 720 | 480 | 360; url: string }> | undefined>(undefined);
  const [segments, setSegments] = useState<Array<{ type: "ad" | "skip"; start: number; end: number }>>([]);

  const [autonext, setAutonext] = useState(true);

  // поиск
  const [qTr, setQTr] = useState("");
  const [qEp, setQEp] = useState("");

  // фильтры
  const filteredVersions = useMemo(() => {
    const qq = qTr.trim().toLowerCase();
    if (!qq) return orderedVersions;
    return orderedVersions.filter((v) => trName(v).toLowerCase().includes(qq));
  }, [qTr, orderedVersions]);

  const filteredEpisodes = useMemo(() => {
    const q = qEp.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((ep) => {
      const nMatch = String(ep.number ?? "").includes(q);
      const tMatch = (ep.title || "").toLowerCase().includes(q);
      return nMatch || tMatch;
    });
  }, [episodes, qEp]);

  // загрузить сохранённое
  useEffect(() => {
    if (!storeKey) return;
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.vIdx === "number") setVIdx(Math.min(saved.vIdx, Math.max(0, orderedVersions.length - 1)));
      if (typeof saved.sIdx === "number") setSIdx(saved.sIdx);
      if (typeof saved.currentEpIdx === "number") setCurrentEpIdx(saved.currentEpIdx);
      if (saved.tab === "direct" || saved.tab === "iframe") setTab(saved.tab);
      if (typeof saved.autonext === "boolean") setAutonext(saved.autonext);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, orderedVersions.length]);

  // сохранить состояние
  useEffect(() => {
    if (!storeKey) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ vIdx, sIdx, currentEpIdx, tab, autonext }));
    } catch {}
  }, [storeKey, vIdx, sIdx, currentEpIdx, tab, autonext]);

  // при смене перевода/сезона — первая доступная серия
  useEffect(() => {
    const l = episodes[0] ? pickLink(episodes[0]) : "";
    if (l) {
      setCurrentEpIdx(0);
      setLink(l);
      setDirectUrl(null);
      setDirectKind("unknown");
      setQualities(undefined);
      setSegments([]);
      setErr(null);
    } else if (!initialLink) {
      setLink("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vIdx, sIdx]);

  // если initialLink пуст — взять первую
  useEffect(() => {
    if (!initialLink && episodes.length) {
      const l = pickLink(episodes[0]);
      if (l) setLink(l);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes.length]);

  // запрос прямой ссылки — БЕЗ new URL()
  async function fetchDirect(targetLink: string, signal?: AbortSignal) {
    setLoading(true);
    setErr(null);
    setDirectUrl(null);
    setDirectKind("unknown");
    setQualities(undefined);
    setSegments([]);
    try {
      const u = `${apiBase}/api/kodik/video-link/?link=${encodeURIComponent(targetLink)}`;
      const r = await fetch(u, { cache: "no-store", signal });
      if (!r.ok) throw new Error(await r.text());
      const data: KodikResponse = await r.json();

      const { directUrl, kind, qualities, segments } = parseKodik(data);
      if (!directUrl) throw new Error("Не удалось распознать прямую ссылку");

      setDirectUrl(directUrl);
      setDirectKind(kind);
      setQualities(qualities);
      setSegments(segments);
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message || "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }

  // фетч прямой — только когда выбран direct
  useEffect(() => {
    if (tab !== "direct" || !link) return;
    const ctrl = new AbortController();
    fetchDirect(link, ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, link]);

  // обработчики
  const chooseVersion = (i: number) => {
    setVIdx(i);
    setSIdx(0);
    setCurrentEpIdx(0);
    setQEp("");
  };
  const chooseSeason = (i: number) => {
    setSIdx(i);
    setCurrentEpIdx(0);
    setQEp("");
  };
  const chooseEpisode = (i: number) => {
    setCurrentEpIdx(i);
    const l = filteredEpisodes[i] ? pickLink(filteredEpisodes[i]) : "";
    if (l) {
      setLink(l);
      setDirectUrl(null);
      setDirectKind("unknown");
      setQualities(undefined);
      setSegments([]);
      setErr(null);
    } else {
      setLink("");
    }
    document?.getElementById("player-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // хоткеи
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") {
        if (currentEpIdx < filteredEpisodes.length - 1) chooseEpisode(currentEpIdx + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentEpIdx > 0) chooseEpisode(currentEpIdx - 1);
      } else if (e.key === "1") setTab("iframe");
      else if (e.key === "2") setTab("direct");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpIdx, filteredEpisodes.length]);

  return (
    <section className="mb-10">
      <div id="player-top" className="grid grid-cols-1 md:grid-cols-[minmax(0,_1fr)_340px] gap-6">
        {/* PLAYER */}
        <SoftCard className="overflow-hidden min-w-0">
          <SourceTabs tab={tab} setTab={setTab} autonext={autonext} setAutonext={setAutonext} />

          <VideoArea
            tab={tab}
            link={link ? norm(link) : ""}
            directUrl={directUrl}
            directKind={directKind}
            qualities={qualities}
            segments={segments}
            loading={loading}
            err={err}
            onEnded={() => {
              if (autonext && currentEpIdx < filteredEpisodes.length - 1) {
                chooseEpisode(currentEpIdx + 1);
              }
            }}
          />
        </SoftCard>

        {/* RIGHT: versions */}
        <SoftCard className="md:sticky md:top-6 md:w-[340px] w-full h-fit">
          <VersionList
            versions={filteredVersions}
            activeIndex={vIdx}
            onChoose={chooseVersion}
            q={qTr}
            setQ={setQTr}
          />
        </SoftCard>
      </div>

      {/* bottom controls */}
      <div className="mt-6 space-y-4">
        <SeasonSwitcher seasons={seasons} activeIndex={sIdx} onChoose={chooseSeason} />
        <EpisodeFilters q={qEp} setQ={setQEp} total={filteredEpisodes.length} />
        <EpisodeGrid episodes={filteredEpisodes} currentIndex={currentEpIdx} onChoose={chooseEpisode} />
      </div>
    </section>
  );
}
