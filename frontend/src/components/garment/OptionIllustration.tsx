import type { ReactNode } from "react";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Line-art previews for design options ("Boxes with Visual of different types").
 * Drawn as SVG so every option has a crisp, consistent visual until real
 * photography is supplied via Option.imageUrl.
 */

const SHOULDER_L = "M48,16 L30,22";
const SHOULDER_R = "M72,16 L90,22";
const BODY = "M30,22 Q26,34 28,46 L32,100 L88,100 L92,46 Q94,34 90,22";

const FRONT_NECKS: Record<string, string> = {
  round: "M48,16 Q60,38 72,16",
  v: "M48,16 L60,46 L72,16",
  sweetheart: "M48,16 L50,34 Q54,42 60,35 Q66,42 70,34 L72,16",
  square: "M48,16 L49,36 L71,36 L72,16",
  boat: "M48,16 Q60,24 72,16",
  high: "M52,14 Q60,20 68,14 M48,16 L52,14 M72,16 L68,14 M52,14 L52,9 Q60,12 68,9 L68,14",
  mandarin: "M52,14 Q60,20 68,14 M48,16 L52,14 M72,16 L68,14 M52,14 L52,9 Q60,12 68,9 L68,14",
};

const BACK_NECKS: Record<string, ReactNode> = {
  deep_dori: (
    <>
      <path d="M48,16 Q60,78 72,16" />
      <path d="M52,40 L68,48 M52,48 L68,40" strokeWidth={1.2} />
      <path d="M60,50 L58,62 M60,50 L63,61" strokeWidth={1.2} />
      <circle cx="58" cy="64" r="2" />
      <circle cx="63" cy="63" r="2" />
    </>
  ),
  round: <path d="M48,16 Q60,42 72,16" />,
  u: <path d="M48,16 L48,48 Q60,64 72,48 L72,16" />,
  v: <path d="M48,16 L60,66 L72,16" />,
  keyhole: (
    <>
      <path d="M48,16 Q60,32 72,16" />
      <path d="M60,36 Q52,46 60,58 Q68,46 60,36 Z" />
    </>
  ),
  window: (
    <>
      <path d="M48,16 Q60,30 72,16" />
      <rect x="50" y="38" width="20" height="18" rx="3" />
    </>
  ),
};

const SLEEVES: Record<string, string | null> = {
  sleeveless: null,
  cap: "M30,22 Q18,26 20,36 L28,40",
  short: "M30,22 L16,40 L25,47 L28,44",
  elbow: "M30,22 L12,58 L22,63 L28,44",
  three_quarter: "M30,22 L9,76 L19,79 L28,44",
  full: "M30,22 L6,92 L16,94 L28,44",
  puff: "M30,22 C12,16 8,42 22,46 L28,42 M18,40 L24,42",
};

const CUTS: Record<string, ReactNode> = {
  princess: <path d="M40,30 Q46,60 44,100 M80,30 Q74,60 76,100" strokeDasharray="3 3" />,
  katori: (
    <>
      <path d="M36,56 Q46,70 58,58 M62,58 Q74,70 84,56" strokeDasharray="3 3" />
      <path d="M58,58 L60,100 M62,58 L60,100" strokeDasharray="3 3" />
    </>
  ),
  regular: <path d="M44,100 L47,80 L50,100 M70,100 L73,80 L76,100" strokeDasharray="3 3" />,
};

function sleevePaths(key: string) {
  const d = SLEEVES[key];
  if (!d) return null;
  return (
    <>
      <path d={d} />
      <path d={d} transform="translate(120,0) scale(-1,1)" />
    </>
  );
}

function Bodice({ neck, children }: { neck: ReactNode; children?: ReactNode }) {
  return (
    <>
      <path d={BODY} />
      <path d={SHOULDER_L} />
      <path d={SHOULDER_R} />
      {neck}
      {children}
    </>
  );
}

function resolve(groupKey: string, optionKey: string): ReactNode | null {
  if (groupKey === "front_neck" || groupKey === "neck_style") {
    const neck = FRONT_NECKS[optionKey];
    return neck ? <Bodice neck={<path d={neck} />} /> : null;
  }
  if (groupKey === "back_neck") {
    const neck = BACK_NECKS[optionKey];
    return neck ? <Bodice neck={neck} /> : null;
  }
  if (groupKey === "sleeve_type") {
    if (!(optionKey in SLEEVES)) return null;
    return <Bodice neck={<path d={FRONT_NECKS.round} />}>{sleevePaths(optionKey)}</Bodice>;
  }
  if (groupKey === "cut_type") {
    const cut = CUTS[optionKey];
    return cut ? <Bodice neck={<path d={FRONT_NECKS.round} />}>{cut}</Bodice> : null;
  }
  return null;
}

interface OptionIllustrationProps {
  groupKey: string;
  optionKey: string;
  label: string;
  imageUrl?: string | null;
  className?: string;
}

export function OptionIllustration({ groupKey, optionKey, label, imageUrl, className }: OptionIllustrationProps) {
  const art = imageUrl ? null : resolve(groupKey, optionKey);
  return (
    <div className={cn("relative flex aspect-[4/3] w-full items-center justify-center bg-surface-muted", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- catalogue images come from the API host
        <img src={imageUrl} alt={label} className="absolute inset-0 size-full object-cover" />
      ) : art ? (
        <svg
          viewBox="0 0 120 110"
          role="img"
          aria-label={label}
          className="h-5/6 w-auto text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {art}
        </svg>
      ) : (
        <Shirt aria-hidden strokeWidth={1.25} className="size-1/3 text-border-strong" />
      )}
    </div>
  );
}

/** Hero/marketing illustration: a finished blouse with the default "designer" choices. */
export function BlouseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 110"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Bodice neck={<path d={FRONT_NECKS.sweetheart} />}>
        {sleevePaths("elbow")}
        {CUTS.princess}
      </Bodice>
    </svg>
  );
}
