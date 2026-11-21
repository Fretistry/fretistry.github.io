import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Fretistry mark: an "F" whose arms end in note markers (amber root,
 * teal scale note) over a set of guitar strings. Source: public/brand/fretistry-mark.svg.
 */
export function FretistryMark({
  className,
  withStrings = true,
  svgProps,
}: {
  className?: string;
  withStrings?: boolean;
  /** Extra attributes for the root <svg> (e.g. x/y/width/height when nested in another SVG). */
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  // Plain characters only, so url(#…) references also work in exported SVG/PNG images.
  const id = `fm-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const bg = `${id}-bg`;
  const shine = `${id}-shine`;
  return (
    <svg viewBox="0 0 512 512" className={cn("shrink-0", className)} aria-hidden="true" {...svgProps}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFCB66" />
          <stop offset="0.55" stopColor="#F59E2E" />
          <stop offset="1" stopColor="#E06A1B" />
        </linearGradient>
        <radialGradient id={shine} cx="0.28" cy="0.18" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${bg})`} />
      <rect width="512" height="512" rx="116" fill={`url(#${shine})`} />
      {withStrings && (
        <g stroke="#3A1F0A" strokeOpacity="0.2" strokeLinecap="round">
          {[140, 198, 256, 314, 372].map((y, i) => (
            <line key={y} x1="64" y1={y} x2="448" y2={y} strokeWidth={5 + i} />
          ))}
        </g>
      )}
      <g transform="translate(-18 0)">
        <g fill="#22140A">
          <rect x="150" y="104" width="64" height="304" rx="32" />
          <rect x="150" y="108" width="196" height="64" rx="32" />
          <rect x="150" y="224" width="140" height="64" rx="32" />
          <circle cx="352" cy="140" r="50" />
          <circle cx="300" cy="256" r="46" />
        </g>
        <circle cx="352" cy="140" r="27" fill="#FFCB66" />
        <circle cx="300" cy="256" r="30" fill="#2FC2B2" />
      </g>
    </svg>
  );
}

/** "Fret" + "istry" wordmark in the app's type. */
export function FretistryWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      Fret<span className="text-note-root">istry</span>
    </span>
  );
}
