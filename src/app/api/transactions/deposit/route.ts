import { db } from "@/lib/db";
import { ok, fail, requireUser, genRef, round2 } from "@/lib/api";

const INSTANT_METHODS = ["VISA", "MASTERCARD", "SKRILL", "NETELLER", "BTC", "USDT"];
const MIN = 10;
const MAX = 50000;
const BONUS_RATE = 0.5;
const BONUS_CAP = 500;

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const accountId = String(body.accountId || "");
    const method = String(body.method || "").toUpperCase();
    const amount = Math.round(Number(body.amount) * 100) / 100;

    if (!INSTANT_METHODS.concat("BANK").includes(method)) return fail("Unsupported payment method");
    if (!Number.isFinite(amount) || amount < MIN) return fail(`Minimum deposit is $${MIN}`);
    if (amount > MAX) return fail(`Maximum deposit is $${MAX.toLocaleString()}`);

    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) return fail("Trading account not found", 404);

    const instant = INSTANT_METHODS.includes(method);
    const status = instant ? "COMPLETED" : "PENDING";

    // Welcome bonus: 50% of first deposit, capped at $500
    const priorDeposits = await db.transaction.count({
      where: { userId: user.id, type: "DEPOSIT", status: "COMPLETED" },
    });
    const bonus = priorDeposits === 0 ? Math.min(round2(amount * BONUS_RATE), BONUS_CAP) : 0;

    const tx = await db.transaction.create({
      data: {
        reference: genRef("DEP"),
        type: "DEPOSIT",
        method,
        amount,
        status,
        note: bonus > 0 ? `Includes $${bonus.toFixed(2)} welcome bonus (50%)` : null,
        userId: user.id,
        accountId: account.id,
      },
    });

    if (instant) {
      await db.account.update({
        where: { id: account.id },
        data: {
          // Bonus is credited ONLY to the bonus field (separate trading
          // credit, not withdrawable cash). Equity = balance + bonus, so
          // merging it into balance here would double-count it.
          balance: { increment: amount },
          bonus: bonus > 0 ? { increment: bonus } : undefined,
        },
      });
      await db.notification.create({
        data: {
          userId: user.id,
          title: "Deposit completed",
          body: `$${amount.toFixed(2)} credited to account #${account.number}${bonus > 0 ? ` plus $${bonus.toFixed(2)} welcome bonus` : ""}.`,
          type: "SUCCESS",
        },
      });
    } else {
      await db.notification.create({
        data: {
          userId: user.id,
          title: "Deposit pending",
          body: `Bank transfer of $${amount.toFixed(2)} is being processed. Funds arrive within 1 business day.`,
          type: "INFO",
        },
      });
    }

    const fresh = await db.account.findUnique({ where: { id: account.id } });
    return ok(
      {
        transaction: tx,
        bonus,
        balance: fresh ? round2(fresh.balance) : 0,
      },
      201
    );
  } catch {
    return fail("Deposit failed. Please try again.", 500);
  }
}
