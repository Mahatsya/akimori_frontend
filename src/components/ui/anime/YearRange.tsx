"use client";

import { useMemo } from "react";

type Props = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  step?: number;
  format?: (n: number) => string;
};

export default function YearRange({
  min,
  max,
  value,
  onChange,
  step = 1,
  format = (n) => String(n),
}: Props) {
  const [a, b] = value;
  const left = Math.max(min, Math.min(a, b));
  const right = Math.min(max, Math.max(a, b));

  const leftPct = useMemo(() => ((left - min) / (max - min)) * 100, [left, min, max]);
  const rightPct = useMemo(() => ((right - min) / (max - min)) * 100, [right, min, max]);

  const handleA = (n: number) => onChange([Math.min(n, right), right]);
  const handleB = (n: number) => onChange([left, Math.max(n, left)]);

  return (
    <div className="w-full">
      <div className="mb-2 text-center text-sm font-semibold">
        {format(left)} <span className="opacity-60">–</span> {format(right)}
      </div>

      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--border)]" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={left}
          onChange={(e) => handleA(Number(e.target.value))}
          className="absolute left-0 top-0 h-8 w-full appearance-none bg-transparent pointer-events-auto"
          aria-label="Минимальный год"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={right}
          onChange={(e) => handleB(Number(e.target.value))}
          className="absolute left-0 top-0 h-8 w-full appearance-none bg-transparent pointer-events-auto"
          aria-label="Максимальный год"
        />

        <style jsx>{`
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 9999px;
            background: white;
            border: 2px solid var(--border);
            box-shadow: 0 0 0 3px rgba(0,0,0,.15);
            cursor: pointer;
            position: relative;
            z-index: 10;
          }
          input[type="range"]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 9999px;
            background: white;
            border: 2px solid var(--border);
            box-shadow: 0 0 0 3px rgba(0,0,0,.15);
            cursor: pointer;
            position: relative;
            z-index: 10;
          }
          input[type="range"]::-webkit-slider-runnable-track,
          input[type="range"]::-moz-range-track {
            height: 3px;
            background: transparent;
          }
        `}</style>
      </div>
    </div>
  );
}
