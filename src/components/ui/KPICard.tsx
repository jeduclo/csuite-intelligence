// src/components/ui/KPICard.tsx
// Displays a single executive metric with signal colour, trend arrow, and delta.
// Props:
//   label   — the question this metric answers (plain English)
//   value   — the formatted value string e.g. "$6.97M"
//   delta   — change vs prior period e.g. "+2.1%"
//   signal  — "green" | "amber" | "red" | "blue" (drives colour)
//   caption — optional one-line methodology note

type Signal = "green" | "amber" | "red" | "blue";

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  signal?: Signal;
  caption?: string;
}

const signalStyles: Record<Signal, string> = {
  green: "border-signal-green text-signal-green",
  amber: "border-signal-amber text-signal-amber",
  red:   "border-signal-red   text-signal-red",
  blue:  "border-signal-blue  text-signal-blue",
};

const arrowMap: Record<Signal, string> = {
  green: "↑",
  red:   "↓",
  amber: "→",
  blue:  "→",
};

export function KPICard({
  label,
  value,
  delta,
  signal = "blue",
  caption,
}: KPICardProps) {
  return (
    <div className={`card border-l-4 ${signalStyles[signal]}`}>
      {/* Label — the question being answered */}
      <p className="text-xs uppercase tracking-widest text-signal-muted mb-1">
        {label}
      </p>

      {/* Primary metric value */}
      <p className={`metric text-2xl ${signalStyles[signal]}`}>{value}</p>

      {/* Delta row */}
      {delta && (
        <p className={`text-sm mt-1 ${signalStyles[signal]}`}>
          {arrowMap[signal]} {delta}
        </p>
      )}

      {/* Optional methodology footnote */}
      {caption && (
        <p className="text-xs text-signal-muted mt-2 border-t border-navy-border pt-2">
          {caption}
        </p>
      )}
    </div>
  );
}