"use client";

// ============================================================
// Finovation Trade Terminal - instruments, live candlestick
// chart (canvas), order ticket, open positions management.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMarket } from "./market-context";
import { PnlText, PriceFlash, SideBadge, SymbolIcon } from "./ui-bits";
import {
  INSTRUMENTS, getInstrument, candles, quote, changePct, marginRequired,
  positionPnl, round, type Candle,
} from "@/lib/market";
import { api } from "@/lib/client-api";
import type { AccountSummary, Trade } from "@/lib/types";
import { toast } from "sonner";
import {
  Search, Loader2, X, SlidersHorizontal, Wallet, Gauge, CandlestickChart,
  ChevronDown, ChevronUp, Trash2,
} from "lucide-react";

const CATEGORIES = ["All", "Forex", "Crypto", "Metals", "Indices", "Energy"] as const;
const VOLUME_PRESETS = [0.01, 0.05, 0.1, 0.5, 1];

interface Props {
  activeAccount: AccountSummary | undefined;
  openTrades: Trade[];
  refreshMe: () => Promise<void>;
}

export default function TradeTerminal({ activeAccount, openTrades, refreshMe }: Props) {
  const { quotes } = useMarket();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("EURUSD");
  const [volume, setVolume] = useState("0.01");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [placing, setPlacing] = useState<"BUY" | "SELL" | null>(null);
  const [now, setNow] = useState(Date.now());
  const [closing, setClosing] = useState<Trade | null>(null);
  const [partialVol, setPartialVol] = useState("");
  const [closeBusy, setCloseBusy] = useState(false);
  const [modifying, setModifying] = useState<Trade | null>(null);
  const [modSl, setModSl] = useState("");
  const [modTp, setModTp] = useState("");
  const [modBusy, setModBusy] = useState(false);

  const def = getInstrument(symbol);
  const q = quotes[symbol];

  // ticking clock for live PnL + chart
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return INSTRUMENTS.filter(
      (i) =>
        (category === "All" || i.category === category) &&
        (!s || i.symbol.toLowerCase().includes(s) || i.name.toLowerCase().includes(s))
    );
  }, [category, search]);

  const accPositions = useMemo(
    () => openTrades.filter((t) => t.accountId === activeAccount?.id),
    [openTrades, activeAccount]
  );

  const totalFloating = useMemo(
    () => accPositions.reduce((sum, t) => sum + positionPnl(t.symbol, t.side, t.volume, t.openPrice, now), 0),
    [accPositions, now]
  );

  const vol = Number(volume);
  const liveQ = useMemo(() => quote(symbol, now), [symbol, now]);
  const margin = def && vol > 0 ? marginRequired(symbol, vol, liveQ.mid, activeAccount?.leverage ?? 500) : 0;
  const freeMargin = activeAccount ? activeAccount.balance - margin : 0;

  const placeOrder = async (side: "BUY" | "SELL") => {
    if (!activeAccount) return toast.error("Create a trading account first");
    const v = Number(volume);
    if (!Number.isFinite(v) || v < 0.01) return toast.error("Minimum volume is 0.01 lots");
    setPlacing(side);
    try {
      await api("/api/trades", {
        method: "POST",
        body: {
          accountId: activeAccount.id,
          symbol,
          side,
          volume: v,
          stopLoss: stopLoss || null,
          takeProfit: takeProfit || null,
        },
      });
      toast.success(`${symbol} ${side} ${v.toFixed(2)} lots opened`);
      setStopLoss("");
      setTakeProfit("");
      await refreshMe();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      setPlacing(null);
    }
  };

  const closeTrade = async (full: boolean) => {
    if (!closing) return;
    setCloseBusy(true);
    try {
      const body: Record<string, unknown> = { tradeId: closing.id };
      if (!full) {
        const pv = Number(partialVol);
        if (!Number.isFinite(pv) || pv <= 0 || pv >= closing.volume) {
          toast.error(`Partial volume must be between 0.01 and ${(closing.volume - 0.01).toFixed(2)}`);
          setCloseBusy(false);
          return;
        }
        body.volume = pv;
      }
      const res = await api<{ closedTicket: string }>("/api/trades/close", { method: "POST", body });
      toast.success(`Position #${res.closedTicket} closed`);
      setClosing(null);
      setPartialVol("");
      await refreshMe();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Close failed");
    } finally {
      setCloseBusy(false);
    }
  };

  const saveModifications = async () => {
    if (!modifying) return;
    setModBusy(true);
    try {
      await api("/api/trades/modify", {
        method: "POST",
        body: { tradeId: modifying.id, stopLoss: modSl || null, takeProfit: modTp || null },
      });
      toast.success("Position updated");
      setModifying(null);
      await refreshMe();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setModBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Trade terminal</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {activeAccount
              ? <>Account <span className="font-mono">#{activeAccount.number}</span> · 1:{activeAccount.leverage} leverage</>
              : "No trading account — create one from My Account"}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Wallet className="h-3 w-3" /> Balance</div>
            <div className="font-mono text-sm font-bold">${(activeAccount?.balance ?? 0).toFixed(2)}</div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Gauge className="h-3 w-3" /> Free margin</div>
            <div className="font-mono text-sm font-bold">${(activeAccount?.freeMargin ?? 0).toFixed(2)}</div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <div className="text-[11px] text-muted-foreground">Floating P/L</div>
            <PnlText value={totalFloating} className="text-sm" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr_290px]">
        {/* ---------- instruments ---------- */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 bg-background/60 pl-8 text-sm"
                aria-label="Search instruments"
              />
            </div>
            <div className="mt-2.5 flex gap-1 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    category === c ? "bg-emerald-500/15 text-emerald-300" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-1 max-h-[26rem] space-y-0.5 overflow-y-auto pr-0.5 xl:max-h-[32rem]">
              {filtered.map((inst) => {
                const lq = quotes[inst.symbol];
                const pct = changePct(inst.symbol, now);
                const active = inst.symbol === symbol;
                return (
                  <button
                    key={inst.symbol}
                    onClick={() => setSymbol(inst.symbol)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-[13px] font-bold ${active ? "text-emerald-300" : ""}`}>{inst.symbol}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{inst.name}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      {lq && (
                        <>
                          <PriceFlash value={lq.bid} prev={lq.prevBid} digits={inst.digits} className="block text-[12px] font-semibold text-foreground" />
                          <span className={`text-[10px] font-medium ${pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No instruments match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ---------- chart + positions ---------- */}
        <div className="space-y-4">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <SymbolIcon symbol={symbol} className="h-9 w-9" />
                  <div>
                    <div className="text-base font-bold leading-tight">{symbol}</div>
                    <div className="text-xs text-muted-foreground">{def?.name} · spread {def ? def.spread.toFixed(def.digits) : "—"}</div>
                  </div>
                </div>
                {q && def && (
                  <div className="flex items-center gap-5 font-mono">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Bid</div>
                      <PriceFlash value={q.bid} prev={q.prevBid} digits={def.digits} className="text-lg font-bold" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ask</div>
                      <PriceFlash value={q.ask} prev={q.prevBid} digits={def.digits} className="text-lg font-bold" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Change</div>
                      <span className={`text-sm font-bold ${changePct(symbol, now) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {changePct(symbol, now) >= 0 ? "+" : ""}{changePct(symbol, now).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <CandleChart symbol={symbol} now={now} positions={accPositions.filter((t) => t.symbol === symbol)} />
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Simulated market data · 10-second candles · for demo purposes
              </p>
            </CardContent>
          </Card>

          {/* open positions */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <span className="text-sm font-bold">
                  Open positions
                  {accPositions.length > 0 && (
                    <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      {accPositions.length}
                    </span>
                  )}
                </span>
                <PnlText value={totalFloating} className="text-sm" />
              </div>
              {accPositions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No open positions on this account. Use the order ticket to place a trade.
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {accPositions.map((t) => {
                    const id = getInstrument(t.symbol);
                    const pnl = positionPnl(t.symbol, t.side, t.volume, t.openPrice, now);
                    const cur = t.side === "BUY" ? quotes[t.symbol]?.bid : quotes[t.symbol]?.ask;
                    return (
                      <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-3 last:border-0">
                        <SymbolIcon symbol={t.symbol} />
                        <div className="min-w-[7.5rem]">
                          <div className="flex items-center gap-1.5 text-sm font-bold">
                            {t.symbol} <SideBadge side={t.side} />
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            #{t.ticket} · {t.volume.toFixed(2)} lots
                          </div>
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-muted-foreground">Open </span>{t.openPrice.toFixed(id?.digits ?? 2)}
                          <span className="ml-2 text-muted-foreground">Now </span>{cur?.toFixed(id?.digits ?? 2) ?? "—"}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <PnlText value={pnl} className="text-sm" />
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setModifying(t); setModSl(t.stopLoss?.toString() ?? ""); setModTp(t.takeProfit?.toString() ?? ""); }}>
                            <SlidersHorizontal className="mr-1 h-3 w-3" /> SL/TP
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 bg-red-500/15 px-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                            onClick={() => { setClosing(t); setPartialVol(""); }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Close
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---------- order ticket ---------- */}
        <Card className="h-fit border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CandlestickChart className="h-4 w-4 text-emerald-400" /> Order ticket
            </div>

            {/* volume */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Volume (lots)</label>
              <div className="mt-1.5 flex items-stretch gap-1.5">
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Decrease volume"
                  onClick={() => setVolume((v) => Math.max(0.01, round((Number(v) || 0) - 0.01, 2)).toFixed(2))}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  type="number" min={0.01} max={100} step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="h-10 bg-background/60 text-center font-mono text-base font-bold"
                  aria-label="Trade volume in lots"
                />
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Increase volume"
                  onClick={() => setVolume((v) => Math.min(100, round((Number(v) || 0) + 0.01, 2)).toFixed(2))}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1.5 flex gap-1">
                {VOLUME_PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVolume(v.toFixed(2))}
                    className={`flex-1 rounded-md border px-1 py-1 text-[11px] font-semibold transition-colors ${
                      Number(volume) === v
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {v < 1 ? v.toFixed(2) : v.toFixed(0)}
                  </button>
                ))}
              </div>
            </div>

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Stop loss</label>
                <Input
                  type="number" step="any" placeholder="Optional"
                  value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                  className="mt-1.5 h-9 bg-background/60 font-mono text-sm"
                  aria-label="Stop loss price"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Take profit</label>
                <Input
                  type="number" step="any" placeholder="Optional"
                  value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                  className="mt-1.5 h-9 bg-background/60 font-mono text-sm"
                  aria-label="Take profit price"
                />
              </div>
            </div>

            {/* margin info */}
            <div className="space-y-1.5 rounded-lg border border-border/50 bg-background/40 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin required</span>
                <span className="font-mono font-bold">${margin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free margin after</span>
                <span className={`font-mono font-bold ${freeMargin < 0 ? "text-red-400" : ""}`}>${freeMargin.toFixed(2)}</span>
              </div>
            </div>

            {/* buy / sell */}
            {q && def && (
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  onClick={() => placeOrder("SELL")}
                  disabled={placing !== null || !activeAccount}
                  className="h-auto flex-col gap-0.5 bg-red-500 py-2.5 font-bold text-white hover:bg-red-600"
                >
                  {placing === "SELL" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-sm">SELL</span>}
                  <span className="font-mono text-xs font-normal opacity-90">{q.bid.toFixed(def.digits)}</span>
                </Button>
                <Button
                  onClick={() => placeOrder("BUY")}
                  disabled={placing !== null || !activeAccount}
                  className="h-auto flex-col gap-0.5 bg-emerald-500 py-2.5 font-bold text-slate-950 hover:bg-emerald-400"
                >
                  {placing === "BUY" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-sm">BUY</span>}
                  <span className="font-mono text-xs font-normal opacity-90">{q.ask.toFixed(def.digits)}</span>
                </Button>
              </div>
            )}
            {!activeAccount && (
              <p className="text-center text-xs text-amber-400">Create a trading account from My Account to start trading.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- close dialog ---------- */}
      <Dialog open={closing !== null} onOpenChange={(o) => !o && setClosing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close position #{closing?.ticket}</DialogTitle>
            <DialogDescription>
              {closing && (
                <>
                  {closing.symbol} {closing.side} {closing.volume.toFixed(2)} lots — current P/L{" "}
                  <PnlText value={positionPnl(closing.symbol, closing.side, closing.volume, closing.openPrice, now)} />
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {closing && closing.volume > 0.02 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Partial close volume (optional)</label>
              <Input
                type="number" step={0.01} min={0.01}
                placeholder={`Leave empty to close all ${closing.volume.toFixed(2)} lots`}
                value={partialVol} onChange={(e) => setPartialVol(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClosing(null)}>Cancel</Button>
            {closing && closing.volume > 0.02 && (
              <Button variant="secondary" disabled={closeBusy} onClick={() => closeTrade(false)}>Close partial</Button>
            )}
            <Button disabled={closeBusy} className="bg-red-500 text-white hover:bg-red-600" onClick={() => closeTrade(true)}>
              {closeBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Close all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- modify SL/TP dialog ---------- */}
      <Dialog open={modifying !== null} onOpenChange={(o) => !o && setModifying(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modify #{modifying?.ticket}</DialogTitle>
            <DialogDescription>
              {modifying?.symbol} {modifying?.side} {modifying?.volume.toFixed(2)} lots · open {modifying?.openPrice}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stop loss</label>
              <Input type="number" step="any" value={modSl} onChange={(e) => setModSl(e.target.value)} placeholder="None" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Take profit</label>
              <Input type="number" step="any" value={modTp} onChange={(e) => setModTp(e.target.value)} placeholder="None" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifying(null)}>Cancel</Button>
            <Button onClick={saveModifications} disabled={modBusy} className="font-semibold">
              {modBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Canvas candlestick chart - live redrawing, price line,
// entry / SL / TP markers for open positions.
// ============================================================
function CandleChart({
  symbol, now, positions,
}: {
  symbol: string;
  now: number;
  positions: { side: string; openPrice: number; stopLoss?: number | null; takeProfit?: number | null }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = 320;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const def = getInstrument(symbol);
    if (!def) return;

    const data: Candle[] = candles(symbol, now, 80, 10);
    const q = quote(symbol, now);
    const cur = q.mid;
    let hi = Math.max(...data.map((c) => c.h), cur);
    let lo = Math.min(...data.map((c) => c.l), cur);
    for (const p of positions) {
      hi = Math.max(hi, p.openPrice, p.stopLoss ?? -Infinity, p.takeProfit ?? -Infinity);
      lo = Math.min(lo, p.openPrice, p.stopLoss ?? Infinity, p.takeProfit ?? Infinity);
    }
    const pad = (hi - lo) * 0.08 || hi * 0.0005;
    hi += pad;
    lo -= pad;

    const padL = 8, padR = 66, padT = 10, padB = 22;
    const cw = w - padL - padR;
    const ch = h - padT - padB;
    const y = (p: number) => padT + ((hi - p) / (hi - lo)) * ch;
    const bw = cw / data.length;

    // grid + price axis
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.textAlign = "left";
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const p = lo + ((hi - lo) * i) / gridSteps;
      const yy = y(p);
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + cw, yy);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.fillText(p.toFixed(def.digits), padL + cw + 6, yy + 3);
    }

    // candles
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const up = c.c >= c.o;
      const color = up ? "#10b981" : "#ef4444";
      const x = padL + i * bw + bw / 2;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1;
      // wick
      ctx.beginPath();
      ctx.moveTo(x, y(c.h));
      ctx.lineTo(x, y(c.l));
      ctx.stroke();
      // body
      const yo = y(c.o);
      const yc = y(c.c);
      const top = Math.min(yo, yc);
      const bh = Math.max(1.5, Math.abs(yc - yo));
      ctx.globalAlpha = up ? 0.9 : 0.85;
      ctx.fillRect(x - Math.max(1.5, bw * 0.3), top, Math.max(3, bw * 0.6), bh);
      ctx.globalAlpha = 1;
    }

    // current price line + tag
    const cy = y(cur);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(padL, cy);
    ctx.lineTo(padL + cw, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    const label = cur.toFixed(def.digits);
    ctx.fillStyle = "#334155";
    ctx.fillRect(padL + cw + 2, cy - 8, padR - 6, 16);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(label, padL + cw + 6, cy + 3);

    // position lines
    for (const p of positions) {
      const drawLine = (price: number, color: string, text: string) => {
        const yy = y(price);
        if (yy < padT || yy > padT + ch) return;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(padL + cw, yy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.textAlign = "right";
        ctx.fillText(text, padL + cw - 4, yy - 4);
        ctx.textAlign = "left";
      };
      drawLine(p.openPrice, "#38bdf8", `${p.side} ${p.openPrice.toFixed(def.digits)}`);
      if (p.stopLoss != null) drawLine(p.stopLoss, "#ef4444", "SL");
      if (p.takeProfit != null) drawLine(p.takeProfit, "#10b981", "TP");
    }
  }, [symbol, now, positions]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={wrapRef} className="w-full" aria-label={`${symbol} live chart`}>
      <canvas ref={canvasRef} className="block h-[320px] w-full" />
    </div>
  );
}
