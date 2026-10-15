import { db } from "@/lib/db";
import { ok, fail, requireUser, summarizeAccount, genTicket } from "@/lib/api";
import { getInstrument, quote, marginRequired, positionPnl } from "@/lib/market";

/** List user's trades (optionally filter status + accountId). */
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // OPEN | CLOSED | null (all)
  const accountId = url.searchParams.get("accountId");

  const where: { userId: string; status?: string; accountId?: string } = { userId: user.id };
  if (status === "OPEN" || status === "CLOSED") where.status = status;
  if (accountId) where.accountId = accountId;

  const trades = await db.trade.findMany({
    where,
    orderBy: { openedAt: "desc" },
    take: 200,
  });
  return ok({ trades });
}

/** Open a new position. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const accountId = String(body.accountId || "");
    const symbol = String(body.symbol || "").toUpperCase();
    const side = String(body.side || "").toUpperCase();
    const volume = Number(body.volume);
    const stopLoss = body.stopLoss != null && body.stopLoss !== "" ? Number(body.stopLoss) : null;
    const takeProfit = body.takeProfit != null && body.takeProfit !== "" ? Number(body.takeProfit) : null;

    if (side !== "BUY" && side !== "SELL") return fail("Invalid order side");
    const def = getInstrument(symbol);
    if (!def) return fail("Unknown trading symbol");

    if (!Number.isFinite(volume) || volume < 0.01 || volume > 100) {
      return fail("Volume must be between 0.01 and 100 lots");
    }
    const vol = Math.round(volume * 100) / 100;

    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) return fail("Trading account not found", 404);

    const t = Date.now();
    const q = quote(symbol, t);
    const openPrice = side === "BUY" ? q.ask : q.bid;

    // ---- margin check ----
    const userTrades = await db.trade.findMany({ where: { userId: user.id, status: "OPEN" } });
    const thisAccTrades = userTrades.filter((tr) => tr.accountId === account.id);

    let usedMargin = 0;
    let floating = 0;
    for (const tr of thisAccTrades) {
      usedMargin += marginRequired(tr.symbol, tr.volume, tr.openPrice, account.leverage);
      floating += positionPnl(tr.symbol, tr.side, tr.volume, tr.openPrice, t);
    }
    // Equity includes bonus credit so welcome-bonus funds can be used as
    // trading margin (standard MT behaviour — bonus is not withdrawable cash).
    const equity = account.balance + (account.bonus ?? 0) + floating;
    const newMargin = marginRequired(symbol, vol, openPrice, account.leverage);
    if (equity - usedMargin < newMargin) {
      return fail("Insufficient free margin. Reduce volume or deposit more funds.");
    }

    // ---- SL/TP sanity ----
    if (stopLoss != null) {
      if (side === "BUY" && stopLoss >= openPrice) return fail("Stop Loss must be below current price for a Buy");
      if (side === "SELL" && stopLoss <= openPrice) return fail("Stop Loss must be above current price for a Sell");
    }
    if (takeProfit != null) {
      if (side === "BUY" && takeProfit <= openPrice) return fail("Take Profit must be above current price for a Buy");
      if (side === "SELL" && takeProfit >= openPrice) return fail("Take Profit must be below current price for a Sell");
    }

    const trade = await db.trade.create({
      data: {
        ticket: genTicket(),
        symbol,
        side,
        volume: vol,
        openPrice,
        stopLoss,
        takeProfit,
        status: "OPEN",
        userId: user.id,
        accountId: account.id,
        comment: body.comment ? String(body.comment).slice(0, 100) : null,
      },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: `Position opened - #${trade.ticket}`,
        body: `${symbol} ${side} ${vol} lots @ ${openPrice}`,
        type: "INFO",
      },
    });

    const freshTrades = await db.trade.findMany({ where: { accountId: account.id, status: "OPEN" } });
    return ok(
      {
        trade,
        account: summarizeAccount(account, freshTrades),
      },
      201
    );
  } catch {
    return fail("Failed to open position. Please try again.", 500);
  }
}

