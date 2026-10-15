// ============================================================
// Finovation Market Engine (shared client + server)
// Deterministic value-noise price simulation.
// The same timestamp always yields the same price, so the
// streaming service and trade execution agree exactly.
// ============================================================

export type Category = "Forex" | "Crypto" | "Metals" | "Indices" | "Energy";

export interface InstrumentDef {
  symbol: string;
  name: string;
  category: Category;
  basePrice: number;
  spread: number; // price units
  digits: number;
  contractSize: number;
  volatility: number; // scale factor for drift
  seed: number;
}

export const INSTRUMENTS: InstrumentDef[] = [
  // ---- Forex ----
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "Forex", basePrice: 1.08654, spread: 0.00007, digits: 5, contractSize: 100000, volatility: 0.8, seed: 11 },
  { symbol: "GBPUSD", name: "Pound / US Dollar", category: "Forex", basePrice: 1.26742, spread: 0.00011, digits: 5, contractSize: 100000, volatility: 0.9, seed: 23 },
  { symbol: "USDJPY", name: "US Dollar / Yen", category: "Forex", basePrice: 151.384, spread: 0.014, digits: 3, contractSize: 100000, volatility: 0.9, seed: 31 },
  { symbol: "AUDUSD", name: "Aussie / US Dollar", category: "Forex", basePrice: 0.65421, spread: 0.00013, digits: 5, contractSize: 100000, volatility: 1.0, seed: 41 },
  { symbol: "USDCAD", name: "US Dollar / Canadian", category: "Forex", basePrice: 1.35841, spread: 0.00015, digits: 5, contractSize: 100000, volatility: 0.8, seed: 53 },
  { symbol: "EURGBP", name: "Euro / Pound", category: "Forex", basePrice: 0.85712, spread: 0.00012, digits: 5, contractSize: 100000, volatility: 0.6, seed: 61 },
  // ---- Crypto ----
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", category: "Crypto", basePrice: 67234.5, spread: 14.0, digits: 1, contractSize: 1, volatility: 2.2, seed: 71 },
  { symbol: "ETHUSD", name: "Ethereum / US Dollar", category: "Crypto", basePrice: 3512.42, spread: 1.4, digits: 2, contractSize: 1, volatility: 2.4, seed: 83 },
  { symbol: "SOLUSD", name: "Solana / US Dollar", category: "Crypto", basePrice: 172.38, spread: 0.35, digits: 2, contractSize: 1, volatility: 2.8, seed: 97 },
  { symbol: "XRPUSD", name: "Ripple / US Dollar", category: "Crypto", basePrice: 0.6238, spread: 0.0014, digits: 4, contractSize: 1, volatility: 2.6, seed: 101 },
  // ---- Metals ----
  { symbol: "XAUUSD", name: "Gold / US Dollar", category: "Metals", basePrice: 2358.46, spread: 0.3, digits: 2, contractSize: 100, volatility: 1.2, seed: 113 },
  { symbol: "XAGUSD", name: "Silver / US Dollar", category: "Metals", basePrice: 27.842, spread: 0.024, digits: 3, contractSize: 5000, volatility: 1.5, seed: 127 },
  // ---- Indices ----
  { symbol: "US30", name: "Dow Jones 30", category: "Indices", basePrice: 39452.3, spread: 2.6, digits: 1, contractSize: 1, volatility: 1.0, seed: 131 },
  { symbol: "NAS100", name: "Nasdaq 100", category: "Indices", basePrice: 17845.6, spread: 1.9, digits: 1, contractSize: 1, volatility: 1.3, seed: 139 },
  { symbol: "US500", name: "S&P 500", category: "Indices", basePrice: 5218.44, spread: 0.55, digits: 2, contractSize: 1, volatility: 1.0, seed: 149 },
  // ---- Energy ----
  { symbol: "USOIL", name: "WTI Crude Oil", category: "Energy", basePrice: 78.65, spread: 0.05, digits: 2, contractSize: 1000, volatility: 1.6, seed: 151 },
  { symbol: "UKOIL", name: "Brent Crude Oil", category: "Energy", basePrice: 82.94, spread: 0.06, digits: 2, contractSize: 1000, volatility: 1.5, seed: 163 },
];

const MAP: Record<string, InstrumentDef> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i])
);

export function getInstrument(symbol: string): InstrumentDef | undefined {
  return MAP[symbol];
}

export function allSymbols(): string[] {
  return INSTRUMENTS.map((i) => i.symbol);
}

// ---- deterministic noise ----
function hash1(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function noise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i + seed) * (1 - u) + hash1(i + 1 + seed) * u;
}

/** Mid-market price for a symbol at unix-ms timestamp t. */
export function midPrice(symbol: string, t: number): number {
  const def = MAP[symbol];
  if (!def) return 0;
  const s = t / 1000;
  let drift = 0;
  drift += (noise(s / 620, def.seed) - 0.5) * 0.009 * def.volatility;
  drift += (noise(s / 95, def.seed + 7) - 0.5) * 0.0035 * def.volatility;
  drift += (noise(s / 16, def.seed + 13) - 0.5) * 0.0011 * def.volatility;
  drift += (noise(s / 2.6, def.seed + 29) - 0.5) * 0.00034 * def.volatility;
  drift += Math.sin(s / 11 + def.seed) * 0.00013 * def.volatility;
  return def.basePrice * (1 + drift);
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  t: number;
}

export function quote(symbol: string, t: number): Quote {
  const def = MAP[symbol];
  const mid = midPrice(symbol, t);
  return {
    symbol,
    bid: round(mid - def.spread / 2, def.digits),
    ask: round(mid + def.spread / 2, def.digits),
    mid: round(mid, def.digits),
    spread: def.spread,
    t,
  };
}

export function quoteAll(t: number): Record<string, Quote> {
  const out: Record<string, Quote> = {};
  for (const def of INSTRUMENTS) out[def.symbol] = quote(def.symbol, t);
  return out;
}

/** 24h-style change % (vs price 8 hours ago for visible movement). */
export function changePct(symbol: string, t: number): number {
  const prev = midPrice(symbol, t - 8 * 3600 * 1000);
  const now = midPrice(symbol, t);
  return ((now - prev) / prev) * 100;
}

export function round(v: number, digits: number): number {
  const p = Math.pow(10, digits);
  return Math.round(v * p) / p;
}

/** Deterministic OHLC candles for chart history (client-side generation). */
export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export function candles(symbol: string, tNow: number, count = 90, stepSec = 10): Candle[] {
  const out: Candle[] = [];
  const start = tNow - count * stepSec * 1000;
  for (let i = 0; i < count; i++) {
    const t0 = start + i * stepSec * 1000;
    const o = midPrice(symbol, t0);
    const c = midPrice(symbol, t0 + stepSec * 1000);
    let h = Math.max(o, c);
    let l = Math.min(o, c);
    for (let k = 1; k < 4; k++) {
      const v = midPrice(symbol, t0 + (stepSec * 1000 * k) / 4);
      h = Math.max(h, v);
      l = Math.min(l, v);
    }
    out.push({ t: t0 + stepSec * 1000, o, h, l, c });
  }
  return out;
}

/** Margin required to open a position. */
export function marginRequired(symbol: string, volume: number, price: number, leverage: number): number {
  const def = MAP[symbol];
  if (!def || leverage <= 0) return 0;
  return (volume * def.contractSize * price) / leverage;
}

/** Live floating PnL of a position. */
export function positionPnl(
  symbol: string,
  side: string,
  volume: number,
  openPrice: number,
  t: number
): number {
  const def = MAP[symbol];
  if (!def) return 0;
  const q = quote(symbol, t);
  const close = side === "BUY" ? q.bid : q.ask;
  const dir = side === "BUY" ? 1 : -1;
  return (close - openPrice) * def.contractSize * volume * dir;
}

export function fmtPrice(price: number, digits: number): string {
  return price.toFixed(digits);
}

export function fmtMoney(v: number, currency = "USD"): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}${currency === "USD" ? "$" : ""}${Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
