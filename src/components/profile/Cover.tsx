"use client";

type Props = { headerUrl?: string | null };

export default function Cover({ headerUrl }: Props) {
  const lower = (headerUrl || "").toLowerCase();
  const isVideo = lower.endsWith(".webm") || lower.endsWith(".mp4");
  const isImage = !!headerUrl && !isVideo;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      {/* запасной градиент на переменных */}
      <div
        className="aspect-[16/5] w-full"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 35%, transparent), color-mix(in oklab, var(--primary) 35%, transparent))",
        }}
        aria-hidden={!!headerUrl}
      />

      {isVideo && headerUrl && (
        <>
          <video
            src={headerUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.35),transparent)]" />
        </>
      )}

      {isImage && headerUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${headerUrl}")` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.35),transparent)]" />
        </>
      )}
    </div>
  );
}
