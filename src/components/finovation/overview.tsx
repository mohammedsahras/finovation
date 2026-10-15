"use client";

// ============================================================
// Overview / My Account - live stats, equity chart, positions,
// trading accounts management, recent transactions.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMarket } from "./market-context";
import { PnlText, SideBadge, SymbolIcon, StatusBadge, TypeBadge } from "./ui-bits";
import { positionPnl, marginRequired, getInstrument } from "@/lib/market";
import { api } from "@/lib/client-api";
import type { AccountSummary, Transaction, Trade, User } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowDownToLine, ArrowUpFromLine, CandlestickChart, Plus, BadgeCheck,
  Wallet, ShieldCheck, Gauge, PieChart, ChevronRight, Loader2,
} from "lucide-react";

interface Props {
  user: User;
  accounts: AccountSummary[];
  activeAccount: AccountSummary | undefined;
  openTrades: Trade[];
  onSection: (s: "trade" | "deposit" | "withdraw" | "history") => void;
  refreshMe: () => Promise<void>;
}

export default function Overview({ user, accounts, activeAccount, openTrades, onSection, refreshMe }: Props) {
  const { quotes } = useMarket();
  const [now, setNow] = useState(Date.now());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState("STANDARD");
  const [newLev, setNewLev] = useState("500");
  const equityHistory = useRef<{ t: number; v: number }[]>([]);

  // ticking clock for live PnL
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // recent transactions
  useEffect(() => {
    api<{ transactions: Transaction[] }>("/api/transactions")
      .then((r) => setTransactions(r.transactions.slice(0, 5)))
      .catch(() => {});
  }, []);

  const accTrades = useMemo(
    () => openTrades.filter((t) => t.accountId === activeAccount?.id),
    [openTrades, activeAccount]
  );

  const live = useMemo(() => {
    if (!activeAccount) return { equity: 0, freeMargin: 0, margin: 0, level: 0, floating: 0 };
    let floating = 0;
    let margin = 0;
    for (const t of accTrades) {
      floating += positionPnl(t.symbol, t.side, t.volume, t.openPrice, now);
      margin += marginRequired(t.symbol, t.volume, t.openPrice, activeAccount.leverage);
    }
    const equity = activeAccount.balance + floating;
    return {
      equity,
      margin,
      freeMargin: equity - margin,
      level: margin > 0 ? (equity / margin) * 100 : 0,
      floating,
    };
  }, [activeAccount, accTrades, now]);

  // session equity series (live)
  useEffect(() => {
    const h = equityHistory.current;
    const last = h[h.length - 1];
    if (!last || Date.now() - last.t > 900) {
      h.push({ t: Date.now(), v: Math.round(live.equity * 100) / 100 });
      if (h.length > 150) h.shift();
    }
  }, [live.equity]);

  const chartData = equityHistory.current.map((p) => ({
    t: new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    v: p.v,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const createAccount = async () => {
    setCreating(true);
    try {
      await api("/api/accounts", { method: "POST", body: { type: newType, leverage: Number(newLev) } });
      await refreshMe();
      toast.success("New trading account created");
      setCreateOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const stats = [
    { label: "Balance", value: `$${(activeAccount?.balance ?? 0).toFixed(2)}`, icon: Wallet, sub: `Bonus $${(activeAccount?.bonus ?? 0).toFixed(2)}`, neutral: true },
    { label: "Equity", value: `$${live.equity.toFixed(2)}`, icon: PieChart, sub: accTrades.length ? `${accTrades.length} open position${accTrades.length > 1 ? "s" : ""}` : "No open positions", green: live.floating >= 0 },
    { label: "Free margin", value: `$${live.freeMargin.toFixed(2)}`, icon: ShieldCheck, sub: `Margin used $${live.margin.toFixed(2)}`, neutral: true },
    { label: "Margin level", value: live.margin > 0 ? `${live.level.toFixed(0)}%` : "—", icon: Gauge, sub: live.margin > 0 && live.level < 100 ? "Margin call zone" : "Healthy", danger: live.margin > 0 && live.level < 100 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            {greeting}, {user.fullName.split(" ")[0]}
            {user.verified && (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeAccount ? (
              <>Account <span className="font-mono">#{activeAccount.number}</span> · {activeAccount.type} · Leverage 1:{activeAccount.leverage}</>
            ) : (
              "Create a trading account to get started"
            )}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button onClick={() => onSection("deposit")} className="font-semibold">
            <ArrowDownToLine className="mr-1.5 h-4 w-4" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => onSection("withdraw")}>
            <ArrowUpFromLine className="mr-1.5 h-4 w-4" /> Withdraw
          </Button>
          <Button variant="outline" onClick={() => onSection("trade")} className="hidden sm:inline-flex">
            <CandlestickChart className="mr-1.5 h-4 w-4" /> Trade
          </Button>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => {
          const I = s.icon;
          return (
            <Card key={s.label} className="border-border/60 bg-card/60">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</span>
                  <I className="h-4 w-4 text-muted-foreground/70" />
                </div>
                <div className={`mt-2 font-mono text-lg font-bold tabular-nums sm:text-2xl ${
                  s.green === true ? "text-emerald-400" : s.danger ? "text-amber-400" : ""
                }`}>
                  {s.value}
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">{s.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* equity chart */}
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Live equity — {activeAccount ? `#${activeAccount.number}` : "—"}</CardTitle>
            <PnlText value={live.floating} className="text-sm" />
          </CardHeader>
          <CardContent className="h-56 pt-4 sm:h-64">
            {chartData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#8b98a9" }} tickLine={false} axisLine={false} minTickGap={40} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#8b98a9" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#111820", border: "1px solid #2a3441", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8b98a9" }}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, "Equity"]}
                  />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#eq)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Collecting live equity data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* accounts */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Trading accounts</CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> New</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Open a new trading account</DialogTitle>
                  <DialogDescription>You can hold up to 5 accounts. Switch anytime from the top bar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account type</label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard — spreads from 0.3 pips</SelectItem>
                        <SelectItem value="PRO">Pro — spreads from 0.1 pips</SelectItem>
                        <SelectItem value="ZERO">Zero — spreads from 0.0 pips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Leverage</label>
                    <Select value={newLev} onValueChange={setNewLev}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["200", "500", "1000", "2000"].map((l) => (
                          <SelectItem key={l} value={l}>1:{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createAccount} disabled={creating} className="font-semibold">
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {accounts.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                  a.id === activeAccount?.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 bg-background/40"
                }`}
              >
                <div>
                  <div className="font-mono text-sm font-semibold">#{a.number}</div>
                  <div className="text-xs text-muted-foreground">{a.type} · 1:{a.leverage} · {a.openPositions} open</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">${a.balance.toFixed(2)}</div>
                  {a.floatingPnl !== 0 && <PnlText value={a.floatingPnl} className="text-xs" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* open positions */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Open positions</CardTitle>
            <Button size="sm" variant="ghost" className="text-emerald-400" onClick={() => onSection("trade")}>
              Trade terminal <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {accTrades.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CandlestickChart className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No open positions. Head to the terminal to place your first trade.</p>
                <Button size="sm" variant="outline" onClick={() => onSection("trade")}>Open terminal</Button>
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {accTrades.map((t) => {
                  const def = getInstrument(t.symbol);
                  const pnl = positionPnl(t.symbol, t.side, t.volume, t.openPrice, now);
                  const cur = t.side === "BUY" ? quotes[t.symbol]?.bid : quotes[t.symbol]?.ask;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3.5 py-2.5">
                      <div className="flex items-center gap-3">
                        <SymbolIcon symbol={t.symbol} />
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {t.symbol} <SideBadge side={t.side} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.volume} lots @ {t.openPrice.toFixed(def?.digits ?? 2)} → {cur?.toFixed(def?.digits ?? 2) ?? "—"}
                          </div>
                        </div>
                      </div>
                      <PnlText value={pnl} className="text-sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* recent transactions */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <Button size="sm" variant="ghost" className="text-emerald-400" onClick={() => onSection("history")}>
              Full history <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No transactions yet. Make your first deposit to start trading.</p>
                <Button size="sm" variant="outline" onClick={() => onSection("deposit")}>Deposit funds</Button>
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <TypeBadge type={tx.type} />
                        <span className="font-mono text-xs text-muted-foreground">{tx.reference}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {tx.method} · {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`font-mono text-sm font-bold ${tx.type === "DEPOSIT" ? "text-emerald-400" : "text-amber-400"}`}>
                        {tx.type === "DEPOSIT" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
