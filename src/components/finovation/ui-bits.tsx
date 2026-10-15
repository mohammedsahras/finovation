"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getInstrument } from "@/lib/market";

/** Finovation brand logo mark + wordmark. */
export function Logo({ compact = false, size = "md" }: { compact?: boolean; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={cn(
          box,
          "relative rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[62%] w-[62%] text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-6 4 3 6-8" />
          <path d="M14 6h4v4" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <span className={cn(text, "font-bold tracking-tight text-foreground")}>Fino</span>
          <span className={cn(text, "font-bold tracking-tight text-emerald-400")}>vation</span>
        </div>
      )}
    </div>
  );
}

/** Bid price that flashes green/red when it moves. */
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
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
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
    Forex: "bg-cyan-500/15 text-cyan-300",
    Crypto: "bg-amber-500/15 text-amber-300",
    Metals: "bg-yellow-500/15 text-yellow-300",
    Indices: "bg-violet-500/15 text-violet-300",
    Energy: "bg-orange-500/15 text-orange-300",
  };
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold", colors[cat], className)}>
      {symbol.slice(0, 3)}
    </span>
  );
}
