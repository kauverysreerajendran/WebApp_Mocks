import Image from "next/image";
import type { CSSProperties } from "react";
import type { MediaImage } from "@/config/media";

/** Source pixel size of the hero art — every overlay below is placed in these coordinates. */
const W = 1372;
const H = 941;

/** Pink spool on the machine's top pin. */
const SPOOL = { x: 1211, y: 280, w: 37, h: 46 };

/** Sunlit dust drifting under the lamp (image px, delay s, duration s). */
const MOTES: [number, number, number, number][] = [
  [560, 300, 0, 11],
  [620, 420, 2.5, 13],
  [700, 260, 5, 12],
  [760, 380, 1.2, 14],
  [520, 470, 7, 12],
  [680, 520, 3.6, 15],
  [820, 300, 8.4, 13],
  [600, 230, 9.6, 11],
  [880, 450, 4.8, 14],
  [740, 470, 6.2, 12],
];

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const box = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({
  left: pct(r.x, W),
  top: pct(r.y, H),
  width: pct(r.w, W),
  height: pct(r.h, H),
});

/**
 * The hero photo with a little life in it: a slow camera drift, a breathing lamp glow,
 * floating dust, and the machine's spool turning as thread feeds off it. The scene mirrors
 * `object-cover` (centre 62%) with a fixed-ratio box so every overlay stays pinned to its
 * spot in the photo at any size.
 */
export function HeroScene({ image }: { image: MediaImage }) {
  return (
    <div className="hero-live absolute inset-0 overflow-hidden [container-type:size]">
      <div className="hero-live-frame">
        <div className="hero-live-drift absolute inset-0">
          <Image src={image.src} alt={image.alt} fill priority unoptimized sizes="64vw" className="object-cover" />

          <span aria-hidden className="hero-live-glow" />

          {MOTES.map(([x, y, delay, dur]) => (
            <span
              key={`${x}-${y}`}
              aria-hidden
              className="hero-live-mote"
              style={{ left: pct(x, W), top: pct(y, H), animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
            />
          ))}

          <span aria-hidden className="hero-live-spool" style={box(SPOOL)} />

          <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full">
            <path className="hero-live-thread" d="M1211 293 L1137 324 Q1100 333 1062 330" />
          </svg>
        </div>
      </div>
    </div>
  );
}
