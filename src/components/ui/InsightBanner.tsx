// src/components/ui/InsightBanner.tsx
// The prescriptive action callout — never just a number, always "what to do".
// Displayed at the top of each dashboard page.
// Props:
//   title   — short headline e.g. "DSCR Warning"
//   message — the recommended action in plain English
//   signal  — drives the banner colour
//   updated — ISO timestamp of last data refresh

type Signal = "green" | "amber" | "red" | "blue";

interface InsightBannerProps {
  title: string;
  message: string;
  signal?: Signal;
  updated?: string;
}

const bannerStyles: Record<Signal, string> = {
  green: "bg-signal-green/10 border-signal-green text-signal-green",
  amber: "bg-signal-amber/10 border-signal-amber text-signal-amber",
  red:   "bg-signal-red/10   border-signal-red   text-signal-red",
  blue:  "bg-signal-blue/10  border-signal-blue  text-signal-blue",
};

export function InsightBanner({
  title,
  message,
  signal = "blue",
  updated,
}: InsightBannerProps) {
  return (
    <div className={`border rounded-lg px-4 py-3 mb-6 ${bannerStyles[signal]}`}>
      <div className="flex items-start gap-3">
        {/* Icon — simple signal indicator */}
        <span className="text-lg mt-0.5">
          {signal === "red" ? "⚠" : signal === "green" ? "✓" : "→"}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm text-white/80 mt-0.5">{message}</p>
        </div>
        {/* Timestamp */}
        {updated && (
          <span className="text-xs text-signal-muted whitespace-nowrap">
            {new Date(updated).toLocaleDateString("en-CA")}
          </span>
        )}
      </div>
    </div>
  );
}