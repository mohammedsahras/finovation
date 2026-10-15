"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getInstrument } from "@/lib/market";

/**
 * Finovation brand logo — gold gradient mark with market-motif.
 * size: sm (topbar compact) | md (default) | lg (auth / splash)
 */
export function Logo({ compact = false, size = "md" }: { compact?: boolean; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex select-none items-center gap-2.5">
      <div
        className={cn(
          box,
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_4px_20px_-4px_rgba(245,178,58,0.55)] ring-1 ring-amber-300/40"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[60%] w-[60%] text-[#20160a]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l5-6 4 3 6-8" />
          <path d="M14 6h4v4" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <span className={cn(text, "font-bold tracking-tight text-foreground")}>Fino</span>
          <span className={cn(text, "bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text font-bold tracking-tight text-transparent")}>vation</span>
        </div>
      )}
    </div>
  );
}

/** Bid price that flashes green/red when it moves (trading semantics). */
export function PriceFlash({ value, prev, className, digits }: { value: number; prev: number; className?: string; digits: number }) {
  const dir = value > prev ? "up" : value < prev ? "down" : "flat";
  return (
    <span
      className={cn(
        "font-mono tabular-nums transition-colors duration-300",
        dir === "up" && "text-emerald-400",
        dir === "down" && "text-red-400",
        className
      )}
    >
      {value.toFixed(digits)}
    </span>
  );
}

export function ChangeBadge({ pct, className }: { pct: number; className?: string }) {
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
        className
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

export function PnlText({ value, className, children }: { value: number; className?: string; children?: React.ReactNode }) {
  return (
    <span className={cn("font-mono font-semibold tabular-nums", value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-muted-foreground", className)}>
      {children}
      {value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}
    </span>
  );
}

export function SideBadge({ side }: { side: string }) {
  const buy = side === "BUY";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide",
        buy ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      )}
    >
      {buy ? "BUY" : "SELL"}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400",
    PENDING: "bg-amber-500/10 text-amber-400",
    REJECTED: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold", map[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        type === "DEPOSIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
      )}
    >
      {type}
    </span>
  );
}

/** Small symbol avatar with per-category color. */
export function SymbolIcon({ symbol, className }: { symbol: string; className?: string }) {
  const def = getInstrument(symbol);
  const cat = def?.category ?? "Forex";
  const colors: Record<string, string> = {
    Forex: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20",
    Crypto: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20",
    Metals: "bg-yellow-500/15 text-yellow-200 ring-1 ring-yellow-400/20",
    Indices: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20",
    Energy: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/20",
  };
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", colors[cat], className)}>
      {symbol.slice(0, 3)}
    </span>
  );
}

/**
 * Mini SVG sparkline — smooth area path from a numeric series.
 * Used on landing market cards & overview widgets.
 */
export function Sparkline({
  data,
  width = 96,
  height = 32,
  positive,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}) {
  if (data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const up = positive ?? data[data.length - 1] >= data[0];
  const stroke = up ? "#34d399" : "#f87171";
  const fillId = up ? "spark-up" : "spark-down";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
