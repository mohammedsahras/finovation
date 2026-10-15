"use client";

// ============================================================
// Finovation Deposit - payment methods, amount presets,
// welcome bonus, instant confirmation + receipt.
// ============================================================
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMarket } from "./market-context";
import { StatusBadge, TypeBadge } from "./ui-bits";
import { api } from "@/lib/client-api";
import type { AccountSummary, Transaction } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowDownToLine, CreditCard, Bitcoin, Landmark, Wallet, Loader2,
  BadgePercent, Copy, CheckCircle2, ReceiptText, Coins,
} from "lucide-react";

const METHODS = [
  { id: "VISA", label: "Visa", desc: "Instant · no fee", icon: CreditCard, tint: "bg-[#1a1f71]" },
  { id: "MASTERCARD", label: "Mastercard", desc: "Instant · no fee", icon: CreditCard, tint: "bg-[#eb001b]" },
  { id: "SKRILL", label: "Skrill", desc: "Instant e-wallet", icon: Wallet, tint: "bg-[#811e3c]" },
  { id: "NETELLER", label: "Neteller", desc: "Instant e-wallet", icon: Wallet, tint: "bg-[#f27e31]" },
  { id: "BTC", label: "Bitcoin", desc: "Instant crypto", icon: Bitcoin, tint: "bg-[#f7931a]" },
  { id: "USDT", label: "Tether", desc: "USDT TRC-20", icon: Coins, tint: "bg-[#26a17b]" },
  { id: "BANK", label: "Bank transfer", desc: "1 business day", icon: Landmark, tint: "bg-slate-600" },
] as const;

const PRESETS = [50, 100, 250, 500, 1000];
const MIN = 10, MAX = 50000;

interface Props {
  accounts: AccountSummary[];
  activeAccount: AccountSummary | undefined;
  onSelectAccount: (id: string) => void;
  refreshMe: () => Promise<void>;
}

export default function Deposit({ accounts, activeAccount, onSelectAccount, refreshMe }: Props) {
  const [method, setMethod] = useState<string>("VISA");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [firstDeposit, setFirstDeposit] = useState(false);
  const { connected } = useMarket();

  const amt = Number(amount);

  // load deposit history + determine welcome-bonus eligibility
  useEffect(() => {
    api<{ transactions: Transaction[] }>("/api/transactions")
      .then((r) => {
        const deps = r.transactions.filter((t) => t.type === "DEPOSIT");
        setRecent(deps);
        setFirstDeposit(!deps.some((t) => t.status === "COMPLETED"));
      })
      .catch(() => {});
  }, []);

  const bonus = firstDeposit && Number.isFinite(amt) && amt >= MIN ? Math.min(Math.round(amt * 0.5 * 100) / 100, 500) : 0;
  const credit = Number.isFinite(amt) && amt >= MIN ? amt + bonus : 0;

  // reload deposit history after a new deposit
  const reloadRecent = async () => {
    try {
      const r = await api<{ transactions: Transaction[] }>("/api/transactions");
      const deps = r.transactions.filter((t) => t.type === "DEPOSIT");
      setRecent(deps);
      setFirstDeposit(!deps.some((t) => t.status === "COMPLETED"));
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (!activeAccount) return toast.error("Create a trading account first");
    if (!Number.isFinite(amt) || amt < MIN) return toast.error(`Minimum deposit is $${MIN}`);
    if (amt > MAX) return toast.error(`Maximum deposit is $${MAX.toLocaleString()}`);
    setBusy(true);
    try {
      const res = await api<{ transaction: Transaction; bonus: number; balance: number }>("/api/transactions/deposit", {
        method: "POST",
        body: { accountId: activeAccount.id, method, amount: amt },
      });
      setReceipt(res.transaction);
      if (res.bonus > 0) toast.success(`Deposit complete + $${res.bonus.toFixed(2)} welcome bonus!`);
      else toast.success("Deposit completed successfully");
      setAmount("");
      await refreshMe();
      await reloadRecent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  const copyRef = () => {
    if (!receipt) return;
    navigator.clipboard?.writeText(receipt.reference).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <ArrowDownToLine className="h-6 w-6 text-primary" /> Deposit funds
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fund your account instantly — cards, e-wallets and crypto are credited in seconds.
        </p>
      </div>

      {firstDeposit && (
        <div className="animate-fade-up flex items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/12 to-primary/5 px-4 py-3">
          <BadgePercent className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-primary/95">
            <span className="font-bold">50% welcome bonus active</span> — your first deposit gets up to $500 extra trading credit, automatically.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* account */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2.5 text-sm font-bold">1 · Choose trading account</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectAccount(a.id)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                      a.id === activeAccount?.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/60 bg-background/40 hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-sm font-bold">#{a.number}</div>
                      <div className="text-[11px] text-muted-foreground">{a.type} · 1:{a.leverage}</div>
                    </div>
                    <div className="font-mono text-sm font-bold">${a.balance.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              {accounts.length === 0 && (
                <p className="py-3 text-center text-sm text-amber-400">
                  You have no trading accounts yet — create one from My Account first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* method */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2.5 text-sm font-bold">2 · Payment method</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {METHODS.map((m) => {
                  const I = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        active ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30" : "border-border/60 bg-background/40 hover:bg-muted/50"
                      }`}
                    >
                      <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md text-white ${m.tint}`}>
                        <I className="h-4 w-4" />
                      </span>
                      <div className="text-[13px] font-bold">{m.label}</div>
                      <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* amount */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2.5 text-sm font-bold">3 · Amount (USD)</div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-muted-foreground">$</span>
                <Input
                  type="number" min={MIN} max={MAX} step={1}
                  placeholder={`${MIN} – ${MAX.toLocaleString()}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 bg-background/60 pl-8 font-mono text-lg font-bold"
                  aria-label="Deposit amount in USD"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                      Number(amount) === p
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ${p.toLocaleString()}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* summary */}
        <Card className="h-fit border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ReceiptText className="h-4 w-4 text-primary" /> Summary
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold">{METHODS.find((m) => m.id === method)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit fee</span>
                <span className="font-semibold text-emerald-400">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You deposit</span>
                <span className="font-mono font-bold">${(Number.isFinite(amt) ? amt : 0).toFixed(2)}</span>
              </div>
              {bonus > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Welcome bonus (50%)</span>
                  <span className="font-mono font-bold tabular-nums">+${bonus.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Credited to account</span>
                  <span className="font-mono text-xl font-extrabold tabular-nums text-primary">
                    ${credit.toFixed(2)}
                  </span>
                </div>
                {activeAccount && credit > 0 && (
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    New balance: ${((activeAccount.balance ?? 0) + credit).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={submit}
              disabled={busy || !activeAccount || !Number.isFinite(amt) || amt < MIN}
              className="w-full py-2.5 font-bold shadow-lg shadow-primary/20"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownToLine className="mr-2 h-4 w-4" />}
              {method === "BANK" ? "Create bank transfer" : "Deposit instantly"}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              {connected ? "Payment gateway connected" : "Reconnecting to payment gateway"} · demo mode, no real charges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* recent deposits */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          <div className="border-b border-border/50 px-4 py-3 text-sm font-bold">Your deposits</div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No deposits yet — your first one earns a 50% bonus.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 last:border-0">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TypeBadge type={t.type} />
                      <span className="font-mono text-xs text-muted-foreground">{t.reference}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.method} · {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-emerald-400">+${t.amount.toFixed(2)}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* receipt dialog */}
      <Dialog open={receipt !== null} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle>
              {receipt?.status === "COMPLETED" ? "Deposit completed" : "Deposit pending"}
            </DialogTitle>
            <DialogDescription>
              {receipt?.status === "COMPLETED"
                ? `$${receipt?.amount.toFixed(2)} has been credited to your trading account.`
                : "Your bank transfer is being processed and will arrive within 1 business day."}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={copyRef}
            className="mx-auto flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3.5 py-2 font-mono text-sm transition-colors hover:bg-muted"
            aria-label="Copy transaction reference"
          >
            {receipt?.reference}
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
          {receipt?.note && <p className="text-xs text-primary/90">{receipt.note}</p>}
          <DialogFooter>
            <Button className="w-full font-semibold" onClick={() => setReceipt(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
