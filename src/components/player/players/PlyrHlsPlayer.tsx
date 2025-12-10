"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

type QualityLabel = 720 | 480 | 360;
type Segment = { type: "ad" | "skip"; start: number; end: number };

type Props = {
  src: string;
  kind: "hls" | "mp4" | "unknown";
  qualities?: Array<{ label: QualityLabel; url: string }>;
  segments?: Segment[];
  onEnded?: () => void;
};

function detectKind(u: string): "hls" | "mp4" | "unknown" {
  const l = u.toLowerCase();
  if (l.includes("m3u8") || l.includes(":hls:")) return "hls";
  if (l.endsWith(".mp4")) return "mp4";
  return "unknown";
}

export default function PlyrHlsPlayer({
  src,
  kind,
  qualities,
  segments = [],
  onEnded,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const plyrRef = useRef<any>(null);

  const [activeSkip, setActiveSkip] = useState<Segment | null>(null);

  const orderedQualities = useMemo(
    () => (qualities || []).slice().sort((a, b) => b.label - a.label),
    [qualities]
  );

  const isMobile =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)")?.matches ||
      (navigator as any).maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

  // ---------- attach / switch source ----------
  const loadSource = (url: string, knd: "hls" | "mp4" | "unknown") => {
    const video = videoRef.current;
    if (!video) return;

    try { hlsRef.current?.detachMedia(); } catch {}
    try { hlsRef.current?.destroy(); } catch {}
    hlsRef.current = null;

    if (knd === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, maxBufferLength: 60 });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        video.src = url;
      }
    } else {
      video.src = url;
    }
  };

  // ---------- pretty progress (без «штрихов») ----------
  const paintTrack = () => {
    const root = (hostRef.current?.querySelector(".plyr") as HTMLElement) || null;
    const progress = root?.querySelector(".plyr__progress") as HTMLElement | null;
    const video = videoRef.current;
    if (!root || !progress || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    // remove old layers
    root
      .querySelectorAll(".akm-underlay, .akm-segments, .akm-boundaries")
      .forEach((n) => n.parentElement?.removeChild(n));

    // base bar
    const bar = document.createElement("div");
    bar.className = "akm-underlay";
    bar.style.position = "absolute";
    bar.style.left = "0";
    bar.style.right = "0";
    bar.style.top = "50%";
    bar.style.transform = "translateY(-50%)";
    bar.style.height = "6px";
    bar.style.borderRadius = "6px";
    bar.style.overflow = "hidden";
    bar.style.pointerEvents = "none";
    bar.style.zIndex = "2";
    // мягкая подложка — смотрится аккуратно и не спорит с основной полосой Plyr
    bar.style.background = "linear-gradient(to bottom, rgba(255,255,255,.18), rgba(255,255,255,.12))";
    progress.style.position = "relative";
    progress.appendChild(bar);

    // segments layer
    const segs = document.createElement("div");
    segs.className = "akm-segments";
    segs.style.position = "absolute";
    segs.style.inset = "0";
    segs.style.pointerEvents = "none";
    segs.style.zIndex = "3";
    bar.appendChild(segs);

    const dur = Math.max(0.001, video.duration);
    const addBlock = (start: number, end: number, color: string) => {
      const s = Math.max(0, Math.min(1, start / dur));
      const e = Math.max(0, Math.min(1, end / dur));
      if (e <= s) return;
      const span = document.createElement("div");
      span.style.position = "absolute";
      span.style.left = (s * 100).toFixed(3) + "%";
      span.style.width = ((e - s) * 100).toFixed(3) + "%";
      span.style.top = "0";
      span.style.bottom = "0";
      span.style.background = color;
      span.style.borderRadius = "6px";
      segs.appendChild(span);
    };

    for (const seg of segments) {
      const color = seg.type === "skip"
        ? "linear-gradient( to bottom, rgba(255,84,84,.92), rgba(255,84,84,.78) )"
        : "linear-gradient( to bottom, rgba(255,255,255,.34), rgba(255,255,255,.22) )";
      addBlock(seg.start, seg.end, color);
    }

    // boundaries
    const bounds = document.createElement("div");
    bounds.className = "akm-boundaries";
    bounds.style.position = "absolute";
    bounds.style.inset = "0";
    bounds.style.pointerEvents = "none";
    bounds.style.zIndex = "4";
    bar.appendChild(bounds);

    const addLine = (pos: number) => {
      const x = Math.max(0, Math.min(1, pos / dur));
      const v = document.createElement("div");
      v.style.position = "absolute";
      v.style.left = (x * 100).toFixed(3) + "%";
      v.style.top = "0";
      v.style.bottom = "0";
      v.style.width = "1px";
      v.style.background = "rgba(255,255,255,.95)";
      v.style.boxShadow = "0 0 1px rgba(0,0,0,.5)";
      bounds.appendChild(v);
    };
    segments.forEach((s) => { addLine(s.start); addLine(s.end); });
  };

  // show skip button only while inside skip
  const attachSkipWatcher = () => {
    const video = videoRef.current;
    if (!video) return () => {};
    const handler = () => {
      const t = video.currentTime;
      let inside: Segment | null = null;
      for (const seg of segments) {
        if (seg.type === "skip" && t >= seg.start && t < seg.end) { inside = seg; break; }
      }
      setActiveSkip(inside);
    };
    video.addEventListener("timeupdate", handler);
    return () => video.removeEventListener("timeupdate", handler);
  };

  const onSkipClick = () => {
    const video = videoRef.current;
    if (!video || !activeSkip) return;
    video.currentTime = activeSkip.end + 0.01;
    setActiveSkip(null);
  };

  // ---------- init ----------
  useEffect(() => {
    let destroyed = false;
    const host = hostRef.current;
    if (!host) return;

    while (host.firstChild) host.removeChild(host.firstChild);

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("controls", "");
    video.preload = "metadata";
    video.style.width = "100%";
    video.style.height = "100%";
    host.appendChild(video);
    videoRef.current = video;

    const initialKind = kind === "unknown" ? detectKind(src) : kind;
    loadSource(src, initialKind);

    import("plyr")
      .then(({ default: Plyr }) => {
        if (destroyed) return;

        const baseControls = [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",       // уберём на мобильных
          "settings",
          "pip",
          "airplay",
          "fullscreen",
        ];
        const controls = isMobile ? baseControls.filter(c => c !== "volume") : baseControls;

        const qualityOptions = orderedQualities.map((q) => q.label);
        const defaultQuality = orderedQualities[0]?.label ?? 720;

        const plyr = new Plyr(video, {
          controls,
          ratio: "16:9",
          quality: {
            default: defaultQuality,
            options: qualityOptions,
            forced: true,
            onChange: (q: number) => {
              const target = orderedQualities.find((x) => x.label === q);
              if (!target) return;
              const wasPaused = video.paused;
              const t = video.currentTime;
              const wasMuted = video.muted;
              const k = detectKind(target.url);
              loadSource(target.url, k);
              const onLoaded = () => {
                video.currentTime = t;
                video.muted = wasMuted;
                if (!wasPaused) video.play().catch(() => {});
                video.removeEventListener("loadedmetadata", onLoaded);
              };
              video.addEventListener("loadedmetadata", onLoaded);
            },
          },
          settings: ["quality", "speed", "loop"],
        });

        plyrRef.current = plyr;

        // страховка: убрать volume DOM на таче, если вдруг появился
        if (isMobile) {
          const volEl = (hostRef.current?.querySelector(".plyr__volume") as HTMLElement) || null;
          if (volEl?.parentElement) try { volEl.parentElement.removeChild(volEl); } catch {}
        }

        const onLoadedMeta = () => paintTrack();
        video.addEventListener("loadedmetadata", onLoadedMeta);

        const detachWatch = attachSkipWatcher();

        const handleEnded = () => onEnded?.();
        video.addEventListener("ended", handleEnded);

        return () => {
          detachWatch && detachWatch();
          video.removeEventListener("loadedmetadata", onLoadedMeta);
          video.removeEventListener("ended", handleEnded);
        };
      })
      .catch(() => {});

    return () => {
      destroyed = true;
      try { hlsRef.current?.detachMedia(); } catch {}
      try { hlsRef.current?.destroy(); } catch {}
      hlsRef.current = null;

      try { plyrRef.current?.destroy(); } catch {}
      plyrRef.current = null;

      if (videoRef.current && videoRef.current.parentNode) {
        try { videoRef.current.pause(); } catch {}
        try { videoRef.current.removeAttribute("src"); (videoRef.current as any).load?.(); } catch {}
        try { videoRef.current.parentNode.removeChild(videoRef.current); } catch {}
      }
      videoRef.current = null;
    };
  }, [src, kind, JSON.stringify(segments), JSON.stringify(orderedQualities)]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black" ref={hostRef}>
      {activeSkip && (
        <button
          onClick={onSkipClick}
          className="absolute right-6 top-3/4 -translate-y-1/2 z-40
                     px-4 py-2 rounded-lg font-semibold tracking-wide
                     bg-black/55 text-white border border-white/50 backdrop-blur
                     shadow-xl hover:bg-black/75 hover:border-white transition"
        >
          Пропустить опенинг
        </button>
      )}
    </div>
  );
}
