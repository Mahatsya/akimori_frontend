"use client";

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

/** Безопасный чистый плеер: создаёт <video> вручную, чтобы не ловить mutation/commit ошибки React */
export function SafeDirectPlayer({ src, onEnded }: { src: string | null; onEnded?: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // cleanup
    if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
    if (videoRef.current?.parentNode) { try { videoRef.current.parentNode.removeChild(videoRef.current); } catch {} }
    videoRef.current = null;

    if (!src) return;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("controls", "");
    video.style.width = "100%";
    video.style.height = "100%";
    video.preload = "metadata";
    host.appendChild(video);
    videoRef.current = video;

    const isHls = /\.m3u8(\?|$)/i.test(src);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 60 });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; // Safari
    } else {
      video.src = src; // mp4
    }

    const ended = () => onEnded?.();
    video.addEventListener("ended", ended);

    return () => {
      video.removeEventListener("ended", ended);
      try { hlsRef.current?.destroy(); } catch {}
      hlsRef.current = null;
      if (video.parentNode) { try { video.parentNode.removeChild(video); } catch {} }
      videoRef.current = null;
    };
  }, [src, onEnded]);

  return <div ref={hostRef} className="w-full aspect-video bg-black/80 rounded-lg overflow-hidden" />;
}
