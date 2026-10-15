import { db } from "@/lib/db";
import { ok, fail, requireUser, summarizeAccount, closeTradeAtPrice } from "@/lib/api";
import { getInstrument, quote } from "@/lib/market";

/** Close an open position at the current market price. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const tradeId = String(body.tradeId || "");
    const partialVolume = Number(body.volume);

    const trade = await db.trade.findFirst({ where: { id: tradeId, userId: user.id } });
    if (!trade) return fail("Trade not found", 404);
    if (trade.status !== "OPEN") return fail("Trade is already closed");

    const account = await db.account.findUnique({ where: { id: trade.accountId } });
    if (!account) return fail("Trading account not found", 404);

    const t = Date.now();
    const q = quote(trade.symbol, t);
    const closePrice = trade.side === "BUY" ? q.bid : q.ask;

    // ---- optional partial close ----
    let closingTradeId = trade.id;
    let closeVolume = trade.volume;
    if (Number.isFinite(partialVolume) && partialVolume > 0 && partialVolume < trade.volume - 0.009) {
      // reduce the original position, book PnL for the partial volume
      closeVolume = Math.round(partialVolume * 100) / 100;
      const def = getInstrument(trade.symbol);
      const dir = trade.side === "BUY" ? 1 : -1;
      const pnl = Math.round(
        (closePrice - trade.openPrice) * (def?.contractSize ?? 1) * closeVolume * dir * 100
      ) / 100;
      await db.trade.update({
        where: { id: trade.id },
        data: { volume: Math.round((trade.volume - closeVolume) * 100) / 100 },
      });
      await db.trade.create({
        data: {
          ticket: Math.floor(30000000 + Math.random() * 59999999).toString(),
          symbol: trade.symbol,
          side: trade.side,
          volume: closeVolume,
          openPrice: trade.openPrice,
          closePrice,
          stopLoss: null,
          takeProfit: null,
          pnl: Math.round(pnl * 100) / 100,
          status: "CLOSED",
          userId: user.id,
          accountId: trade.accountId,
          openedAt: trade.openedAt,
          closedAt: new Date(),
          comment: `Partial close of #${trade.ticket}`,
        },
      });
      // Book partial PnL with negative-balance protection (bonus absorbs shortfall first).
      const pAcc = await db.account.findUnique({ where: { id: trade.accountId } });
      if (pAcc) {
        let newBalance = Math.round((pAcc.balance + pnl) * 100) / 100;
        const accData: { balance: number; bonus?: number } = { balance: newBalance };
        if (newBalance < 0) {
          const absorbed = Math.min(pAcc.bonus ?? 0, -newBalance);
          if (absorbed > 0) {
            accData.bonus = Math.round(Math.max(0, pAcc.bonus - absorbed) * 100) / 100;
            newBalance = Math.round((newBalance + absorbed) * 100) / 100;
          }
          accData.balance = Math.max(0, newBalance);
        }
        await db.account.update({ where: { id: trade.accountId }, data: accData });
      }
    } else {
      const pnl = await closeTradeAtPrice(trade, closePrice);
      await db.notification.create({
        data: {
          userId: user.id,
          title: `Position closed - #${trade.ticket}`,
          body: `${trade.symbol} ${trade.side} ${trade.volume} lots @ ${closePrice}. P/L ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
          type: pnl >= 0 ? "SUCCESS" : "WARNING",
        },
      });
    }

    const freshTrades = await db.trade.findMany({ where: { accountId: account.id, status: "OPEN" } });
    const freshTrade = await db.trade.findUnique({ where: { id: closingTradeId } });
    return ok({
      closedTicket: trade.ticket,
      trade: freshTrade,
      account: summarizeAccount(account, freshTrades),
    });
  } catch {
    return fail("Failed to close position. Please try again.", 500);
  }
}
