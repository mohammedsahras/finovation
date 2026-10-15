import { db } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { getInstrument } from "@/lib/market";

/** Modify Stop Loss / Take Profit of an open position. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const tradeId = String(body.tradeId || "");
    const stopLoss = body.stopLoss != null && body.stopLoss !== "" ? Number(body.stopLoss) : null;
    const takeProfit = body.takeProfit != null && body.takeProfit !== "" ? Number(body.takeProfit) : null;

    const trade = await db.trade.findFirst({ where: { id: tradeId, userId: user.id } });
    if (!trade) return fail("Trade not found", 404);
    if (trade.status !== "OPEN") return fail("Cannot modify a closed trade");

    const def = getInstrument(trade.symbol);
    if (stopLoss != null && stopLoss <= 0) return fail("Invalid Stop Loss");
    if (takeProfit != null && takeProfit <= 0) return fail("Invalid Take Profit");
    if (def && stopLoss != null && Math.abs(stopLoss - trade.openPrice) < def.spread * 5) {
      return fail(`Stop Loss is too close to price. Min distance: ${(def.spread * 5).toFixed(def.digits)}`);
    }
    if (def && takeProfit != null && Math.abs(takeProfit - trade.openPrice) < def.spread * 5) {
      return fail(`Take Profit is too close to price. Min distance: ${(def.spread * 5).toFixed(def.digits)}`);
    }

    const updated = await db.trade.update({
      where: { id: trade.id },
      data: { stopLoss, takeProfit },
    });
    return ok({ trade: updated });
  } catch {
    return fail("Failed to modify position. Please try again.", 500);
  }
}
