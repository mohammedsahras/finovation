"use client";

// ============================================================
// Finovation History - closed trades with performance stats
// + full transaction log. Tabs + filters.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PnlText, SideBadge, StatusBadge, SymbolIcon, TypeBadge } from "./ui-bits";
import { api } from "@/lib/client-api";
import { getInstrument } from "@/lib/market";
import type { AccountSummary, Trade, Transaction } from "@/lib/types";
import { History, TrendingUp, TrendingDown, Trophy, Percent, Scale, RefreshCw, Search } from "lucide-react";

interface Props {
  accounts: AccountSummary[];
  activeAccount: AccountSummary | undefined;
}

export default function HistoryView({ accounts, activeAccount }: Props) {
  const [tab, setTab] = useState<"trades" | "transactions">("trades");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [txFilter, setTxFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL">("ALL");

  const load = async () => {
    setLoading(true);
    try {
      const [t, tx] = await Promise.all([
        api<{ trades: Trade[] }>("/api/trades?status=CLOSED"),
        api<{ transactions: Transaction[] }>("/api/transactions"),
      ]);
      setTrades(t.trades);
      setTransactions(tx.transactions);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTrades = useMemo(() => {
    const s = symbolFilter.trim().toUpperCase();
    return trades.filter(
      (t) =>
        (accountFilter === "all" || t.accountId === accountFilter) &&
        (!s || t.symbol.includes(s))
    );
  }, [trades, accountFilter, symbolFilter]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => (t.pnl ?? 0) > 0);
    const losses = filteredTrades.filter((t) => (t.pnl ?? 0) < 0);
    const totalPnl = filteredTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const best = filteredTrades.reduce<Trade | null>(
      (b, t) => (!b || (t.pnl ?? 0) > (b.pnl ?? 0) ? t : b), null
    );
    const worst = filteredTrades.reduce<Trade | null>(
      (b, t) => (!b || (t.pnl ?? 0) < (b.pnl ?? 0) ? t : b), null
    );
    return {
      totalPnl,
      wins: wins.length,
      losses: losses.length,
      winRate: filteredTrades.length ? (wins.length / filteredTrades.length) * 100 : 0,
      best,
      worst,
      totalVolume: filteredTrades.reduce((s, t) => s + t.volume, 0),
    };
  }, [filteredTrades]);

  const filteredTx = useMemo(
    () => transactions.filter((t) => txFilter === "ALL" || t.type === txFilter),
    [transactions, txFilter]
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <History className="h-6 w-6 text-primary" /> History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Review your completed trades and money movements.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "trades" | "transactions")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="trades">Trading history</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "trades" ? (
        <>
          {/* stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Scale}
              label="Net P/L"
              value={`$${stats.totalPnl.toFixed(2)}`}
              tone={stats.totalPnl > 0 ? "good" : stats.totalPnl < 0 ? "bad" : "neutral"}
            />
            <StatCard
              icon={Percent}
              label="Win rate"
              value={`${stats.winRate.toFixed(0)}%`}
              sub={`${stats.wins}W / ${stats.losses}L`}
            />
            <StatCard
              icon={Trophy}
              label="Best trade"
              value={stats.best ? `$${(stats.best.pnl ?? 0).toFixed(2)}` : "—"}
              sub={stats.best?.symbol}
              tone="good"
            />
            <StatCard
              icon={TrendingDown}
              label="Worst trade"
              value={stats.worst ? `$${(stats.worst.pnl ?? 0).toFixed(2)}` : "—"}
              sub={stats.worst?.symbol}
              tone="bad"
            />
          </div>

          {/* filters */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Symbol (e.g. EURUSD)"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="h-9 w-48 bg-background/60 pl-8 text-sm"
                  aria-label="Filter trades by symbol"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setAccountFilter("all")}
                  className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                    accountFilter === "all" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All accounts
                </button>
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccountFilter(a.id)}
                    className={`rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                      accountFilter === a.id ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    #{a.number}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground">{filteredTrades.length} trades</span>
            </CardContent>
          </Card>

          {/* trades list */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-0">
              {loading ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading trades...</p>
              ) : filteredTrades.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No closed trades yet. Trades appear here after you close a position.
                  </p>
                </div>
              ) : (
                <div className="max-h-[30rem] overflow-y-auto">
                  {filteredTrades.map((t) => {
                    const def = getInstrument(t.symbol);
                    return (
                      <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-3 last:border-0">
                        <SymbolIcon symbol={t.symbol} />
                        <div className="min-w-[8rem]">
                          <div className="flex items-center gap-1.5 text-sm font-bold">
                            {t.symbol} <SideBadge side={t.side} />
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            #{t.ticket} · {t.volume.toFixed(2)} lots
                          </div>
                        </div>
                        <div className="hidden font-mono text-xs text-muted-foreground sm:block">
                          {t.openPrice.toFixed(def?.digits ?? 2)} → {t.closePrice?.toFixed(def?.digits ?? 2) ?? "—"}
                        </div>
                        <div className="hidden text-xs text-muted-foreground md:block">
                          {new Date(t.openedAt).toLocaleDateString()} · {new Date(t.closedAt ?? t.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {t.comment && (
                          <span className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">{t.comment}</span>
                        )}
                        <div className="ml-auto text-right">
                          <PnlText value={t.pnl ?? 0} className="text-sm" />
                          {t.commission > 0 && <div className="text-[10px] text-muted-foreground">comm ${t.commission.toFixed(2)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* ---------- transactions ---------- */
        <>
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "DEPOSIT", "WITHDRAWAL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={`rounded-md border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  txFilter === f ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f === "ALL" ? "All transactions" : f === "DEPOSIT" ? "Deposits" : "Withdrawals"}
              </button>
            ))}
          </div>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-0">
              {filteredTx.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">No transactions found.</p>
              ) : (
                <div className="max-h-[34rem] overflow-y-auto">
                  {filteredTx.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-3 last:border-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                        {t.type === "DEPOSIT"
                          ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                          : <TrendingDown className="h-4 w-4 text-amber-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <TypeBadge type={t.type} />
                          <span className="font-mono text-xs text-muted-foreground">{t.reference}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {METHOD_LABEL[t.method] ?? t.method}
                          {t.account ? ` · #${t.account.number}` : ""} · {new Date(t.createdAt).toLocaleString()}
                        </div>
                        {t.note && <div className="mt-0.5 text-[11px] text-emerald-300/80">{t.note}</div>}
                      </div>
                      <div className="ml-auto text-right">
                        <div className={`font-mono text-sm font-bold ${t.type === "DEPOSIT" ? "text-emerald-400" : "text-amber-400"}`}>
                          {t.type === "DEPOSIT" ? "+" : "-"}${t.amount.toFixed(2)}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = {
  VISA: "Visa card",
  MASTERCARD: "Mastercard",
  SKRILL: "Skrill",
  NETELLER: "Neteller",
  BTC: "Bitcoin",
  USDT: "Tether (USDT)",
  BANK: "Bank transfer",
};

function StatCard({
  icon: I, label, value, sub, tone = "neutral",
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70">
            <I className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>
        <div className={`mt-1.5 font-mono text-lg font-bold tabular-nums sm:text-xl ${
          tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : ""
        }`}>
          {value}
        </div>
        {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
