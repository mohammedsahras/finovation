// ============================================================
// Finovation API helpers: responses, auth guard, account math,
// SL/TP processing, reference generators.
// ============================================================
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import { marginRequired, positionPnl, quote, allSymbols } from "@/lib/market";

export function ok(data: object = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function requireUser(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { accounts: { orderBy: { createdAt: "asc" } } },
  });
  return user;
}

export function genAccountNumber(): string {
  return `10${Math.floor(1000000 + Math.random() * 9000000)}`;
}

export function genTicket(): string {
  return Math.floor(30000000 + Math.random() * 59999999).toString();
}

export function genRef(prefix: string): string {
  return `${prefix}-${Math.floor(10000000 + Math.random() * 89999999)}`;
}

export interface AccountSummary {
  id: string;
  number: string;
  type: string;
  currency: string;
  leverage: number;
  balance: number;
  bonus: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number; // percent, 0 when no positions
  floatingPnl: number;
  openPositions: number;
  createdAt: string;
}

/** Compute live margin/equity stats for an account (uses current prices). */
export function summarizeAccount(
  account: {
    id: string;
    number: string;
    type: string;
    currency: string;
    leverage: number;
    balance: number;
    bonus: number;
    createdAt: Date;
  },
  openTrades: { symbol: string; side: string; volume: number; openPrice: number }[]
): AccountSummary {
  const t = Date.now();
  let floatingPnl = 0;
  let margin = 0;
  for (const tr of openTrades) {
    floatingPnl += positionPnl(tr.symbol, tr.side, tr.volume, tr.openPrice, t);
    margin += marginRequired(tr.symbol, tr.volume, tr.openPrice, account.leverage);
  }
  // Equity = Balance + Bonus credit + Floating PnL (MT convention: bonus is
  // spendable trading credit — usable as margin, not withdrawable as cash).
  const equity = account.balance + account.bonus + floatingPnl;
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  return {
    id: account.id,
    number: account.number,
    type: account.type,
    currency: account.currency,
    leverage: account.leverage,
    balance: round2(account.balance),
    bonus: round2(account.bonus),
    equity: round2(equity),
    margin: round2(margin),
    freeMargin: round2(freeMargin),
    marginLevel: margin > 0 ? round2(marginLevel) : 0,
    floatingPnl: round2(floatingPnl),
    openPositions: openTrades.length,
    createdAt: account.createdAt.toISOString(),
  };
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Scan a user's open trades and close any whose SL/TP has been hit.
 * Called whenever the client polls /api/accounts. Returns closed tickets.
 */
export async function processSlTp(userId: string): Promise<string[]> {
  const symbols = allSymbols().join(",");
  const open = await db.trade.findMany({ where: { userId, status: "OPEN" } });
  if (open.length === 0) return [];
  const t = Date.now();
  const closed: string[] = [];

  for (const tr of open) {
    if (!symbols.includes(tr.symbol)) continue;
    const q = quote(tr.symbol, t);
    const isBuy = tr.side === "BUY";
    let closePrice: number | null = null;
    let reason = "";

    if (tr.stopLoss != null) {
      if ((isBuy && q.bid <= tr.stopLoss) || (!isBuy && q.ask >= tr.stopLoss)) {
        closePrice = tr.stopLoss;
        reason = "Stop Loss hit";
      }
    }
    if (!closePrice && tr.takeProfit != null) {
      if ((isBuy && q.bid >= tr.takeProfit) || (!isBuy && q.ask <= tr.takeProfit)) {
        closePrice = tr.takeProfit;
        reason = "Take Profit hit";
      }
    }
    if (closePrice == null) continue;

    const pnl = await closeTradeAtPrice(tr, closePrice);
    closed.push(tr.ticket);
    await db.notification.create({
      data: {
        userId,
        title: `${reason} - #${tr.ticket}`,
        body: `${tr.symbol} ${tr.side} ${tr.volume} lots closed at ${closePrice}. P/L ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
        type: pnl >= 0 ? "SUCCESS" : "WARNING",
      },
    });
  }
  return closed;
}

/** Core close routine: computes PnL, credits balance, marks CLOSED.
 *  Negative-balance protection: if a loss would push balance below zero,
 *  the shortfall is absorbed by bonus credit first, and balance clamps at 0. */
export async function closeTradeAtPrice(
  tr: { id: string; symbol: string; side: string; volume: number; openPrice: number; accountId: string },
  closePrice: number
): Promise<number> {
  const { getInstrument } = await import("@/lib/market");
  const def = getInstrument(tr.symbol);
  const contract = def?.contractSize ?? 1;
  const dir = tr.side === "BUY" ? 1 : -1;
  const pnl = round2((closePrice - tr.openPrice) * contract * tr.volume * dir);
  await db.trade.update({
    where: { id: tr.id },
    data: {
      status: "CLOSED",
      closePrice,
      pnl,
      closedAt: new Date(),
    },
  });

  const account = await db.account.findUnique({ where: { id: tr.accountId } });
  if (account) {
    let newBalance = round2(account.balance + pnl);
    const data: { balance: number; bonus?: number } = { balance: newBalance };
    if (newBalance < 0) {
      const shortfall = -newBalance;
      const absorbed = Math.min(account.bonus ?? 0, shortfall);
      if (absorbed > 0) {
        data.bonus = round2(Math.max(0, account.bonus - absorbed));
        newBalance = round2(newBalance + absorbed);
      }
      data.balance = Math.max(0, newBalance);
    }
    await db.account.update({ where: { id: tr.accountId }, data });
  }
  return pnl;
}
