"use client";

// ============================================================
// Finovation Withdraw - methods, balance validation,
// instant processing + receipt.
// ============================================================
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, TypeBadge } from "./ui-bits";
import { api } from "@/lib/client-api";
import type { AccountSummary, Transaction } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowUpFromLine, CreditCard, Bitcoin, Landmark, Wallet, Loader2,
  CheckCircle2, Copy, ReceiptText, Coins, ShieldCheck, TriangleAlert,
} from "lucide-react";

const METHODS = [
  { id: "VISA", label: "Visa", desc: "Instant · no fee", icon: CreditCard, tint: "bg-[#1a1f71]" },
  { id: "MASTERCARD", label: "Mastercard", desc: "Instant · no fee", icon: CreditCard, tint: "bg-[#eb001b]" },
  { id: "SKRILL", label: "Skrill", desc: "Instant e-wallet", icon: Wallet, tint: "bg-[#811e3c]" },
  { id: "NETELLER", label: "Neteller", desc: "Instant e-wallet", icon: Wallet, tint: "bg-[#f27e31]" },
  { id: "BTC", label: "Bitcoin", desc: "Instant crypto", icon: Bitcoin, tint: "bg-[#f7931a]" },
  { id: "USDT", label: "Tether", desc: "USDT TRC-20", icon: Coins, tint: "bg-[#26a17b]" },
  { id: "BANK", label: "Bank transfer", desc: "Reviewed in 1 day", icon: Landmark, tint: "bg-slate-600" },
] as const;

const MIN = 10;

interface Props {
  accounts: AccountSummary[];
  activeAccount: AccountSummary | undefined;
  onSelectAccount: (id: string) => void;
  refreshMe: () => Promise<void>;
}

export default function Withdraw({ accounts, activeAccount, onSelectAccount, refreshMe }: Props) {
  const [method, setMethod] = useState<string>("VISA");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<Transaction[]>([]);

  const amt = Number(amount);
  const balance = activeAccount?.balance ?? 0;
  const hasOpenPositions = (activeAccount?.openPositions ?? 0) > 0;
  const tooMuch = Number.isFinite(amt) && amt > balance;

  useEffect(() => {
    api<{ transactions: Transaction[] }>("/api/transactions")
      .then((r) => setRecent(r.transactions.filter((t) => t.type === "WITHDRAWAL")))
      .catch(() => {});
  }, []);

  const reloadRecent = async () => {
    try {
      const r = await api<{ transactions: Transaction[] }>("/api/transactions");
      setRecent(r.transactions.filter((t) => t.type === "WITHDRAWAL"));
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (!activeAccount) return toast.error("Create a trading account first");
    if (!Number.isFinite(amt) || amt < MIN) return toast.error(`Minimum withdrawal is $${MIN}`);
    if (amt > balance) return toast.error("Amount exceeds your available balance");
    setBusy(true);
    try {
      const res = await api<{ transaction: Transaction; balance: number }>("/api/transactions/withdraw", {
        method: "POST",
        body: { accountId: activeAccount.id, method, amount: amt },
      });
      setReceipt(res.transaction);
      toast.success(res.transaction.status === "COMPLETED" ? "Withdrawal sent — no fees charged" : "Withdrawal request submitted");
      setAmount("");
      await refreshMe();
      await reloadRecent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
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
          <ArrowUpFromLine className="h-6 w-6 text-emerald-400" /> Withdraw funds
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Withdraw your profits anytime — e-wallets and crypto are processed instantly with zero fees.
        </p>
      </div>

      {hasOpenPositions && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <TriangleAlert className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            <span className="font-bold">Open positions detected.</span> You can withdraw up to your current balance, but closing positions first keeps your margin safe.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* account */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-sm font-bold">1 · Choose trading account</span>
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-sm font-bold text-emerald-400">
                  ${balance.toFixed(2)} available
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectAccount(a.id)}
                    className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                      a.id === activeAccount?.id
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border/60 bg-background/40 hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-sm font-bold">#{a.number}</div>
                      <div className="text-[11px] text-muted-foreground">{a.type} · 1:{a.leverage} · {a.openPositions} open</div>
                    </div>
                    <div className="font-mono text-sm font-bold">${a.balance.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* method */}
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2.5 text-sm font-bold">2 · Withdrawal method</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {METHODS.map((m) => {
                  const I = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        active ? "border-emerald-500/50 bg-emerald-500/10" : "border-border/60 bg-background/40 hover:bg-muted/50"
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
                  type="number" min={MIN} step={1}
                  placeholder={`Min $${MIN}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`h-12 bg-background/60 pl-8 font-mono text-lg font-bold ${tooMuch ? "border-red-500/60" : ""}`}
                  aria-label="Withdrawal amount in USD"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[25, 50, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    disabled={p > balance}
                    className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    ${p}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(balance.toFixed(2))}
                  disabled={balance < MIN}
                  className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  Withdraw all
                </button>
              </div>
              {tooMuch && <p className="mt-2 text-xs text-red-400">Amount exceeds your available balance of ${balance.toFixed(2)}.</p>}
            </CardContent>
          </Card>
        </div>

        {/* summary */}
        <Card className="h-fit border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ReceiptText className="h-4 w-4 text-emerald-400" /> Summary
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold">{METHODS.find((m) => m.id === method)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawal fee</span>
                <span className="font-semibold text-emerald-400">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-mono text-xl font-extrabold text-emerald-400">
                  ${(Number.isFinite(amt) && amt > 0 ? amt : 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2.5">
                <span className="text-muted-foreground">Balance after</span>
                <span className="font-mono font-bold">
                  ${(Number.isFinite(amt) && amt > 0 ? Math.max(0, balance - amt) : balance).toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={submit}
              disabled={busy || !activeAccount || !Number.isFinite(amt) || amt < MIN || tooMuch}
              className="w-full py-2.5 font-bold"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="mr-2 h-4 w-4" />}
              {method === "BANK" ? "Request withdrawal" : "Withdraw instantly"}
            </Button>
            <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Withdrawals are sent to the same method used for deposits. Demo mode — no real funds move.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* recent withdrawals */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          <div className="border-b border-border/50 px-4 py-3 text-sm font-bold">Your withdrawals</div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No withdrawals yet.</p>
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
                    <div className="font-mono text-sm font-bold text-amber-400">-${t.amount.toFixed(2)}</div>
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
              {receipt?.status === "COMPLETED" ? "Withdrawal completed" : "Withdrawal requested"}
            </DialogTitle>
            <DialogDescription>
              {receipt?.status === "COMPLETED"
                ? `$${receipt?.amount.toFixed(2)} has been sent to your ${METHODS.find((m) => m.id === receipt?.method)?.label ?? receipt?.method} account.`
                : "Your request is under review — bank transfers arrive within 1 business day."}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={copyRef}
            className="mx-auto flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3.5 py-2 font-mono text-sm transition-colors hover:bg-muted"
            aria-label="Copy withdrawal reference"
          >
            {receipt?.reference}
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
          {receipt?.note && <p className="text-xs text-muted-foreground">{receipt.note}</p>}
          <DialogFooter>
            <Button className="w-full font-semibold" onClick={() => setReceipt(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
