import { db } from "@/lib/db";
import { ok, fail, requireUser, genRef, round2 } from "@/lib/api";

const MIN = 10;

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const accountId = String(body.accountId || "");
    const method = String(body.method || "").toUpperCase();
    const amount = Math.round(Number(body.amount) * 100) / 100;

    if (!["VISA", "MASTERCARD", "SKRILL", "NETELLER", "BTC", "USDT", "BANK"].includes(method)) {
      return fail("Unsupported withdrawal method");
    }
    if (!Number.isFinite(amount) || amount < MIN) return fail(`Minimum withdrawal is $${MIN}`);

    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) return fail("Trading account not found", 404);

    const openTrades = await db.trade.count({ where: { accountId: account.id, status: "OPEN" } });
    if (openTrades > 0 && amount > account.balance) {
      return fail("You have open positions. Close them before withdrawing this amount.");
    }
    if (amount > account.balance) return fail("Insufficient balance for this withdrawal");

    const bank = method === "BANK";
    const status = bank ? "PENDING" : "COMPLETED";

    const tx = await db.transaction.create({
      data: {
        reference: genRef("WDR"),
        type: "WITHDRAWAL",
        method,
        amount,
        fee: 0,
        status,
        note: bank ? "Under review - funds arrive within 1 business day" : "Processed instantly - no fees",
        userId: user.id,
        accountId: account.id,
      },
    });

    // Deduct immediately to avoid double spending.
    await db.account.update({
      where: { id: account.id },
      data: { balance: { decrement: amount } },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: bank ? "Withdrawal pending" : "Withdrawal completed",
        body: `$${amount.toFixed(2)} ${bank ? "is being processed" : "has been sent"} to your ${method.toLowerCase()} account.`,
        type: bank ? "INFO" : "SUCCESS",
      },
    });

    const fresh = await db.account.findUnique({ where: { id: account.id } });
    return ok({ transaction: tx, balance: fresh ? round2(fresh.balance) : 0 }, 201);
  } catch {
    return fail("Withdrawal failed. Please try again.", 500);
  }
}
