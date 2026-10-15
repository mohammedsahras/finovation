import { db } from "@/lib/db";
import { ok, fail, requireUser, summarizeAccount, processSlTp, genAccountNumber } from "@/lib/api";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  await processSlTp(user.id);

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    include: { accounts: { orderBy: { createdAt: "asc" } } },
  });
  const trades = await db.trade.findMany({ where: { userId: user.id, status: "OPEN" } });
  const summaries = (fresh?.accounts ?? []).map((acc) =>
    summarizeAccount(acc, trades.filter((t) => t.accountId === acc.id))
  );
  return ok({ accounts: summaries });
}

const LEVERAGE_BY_TYPE: Record<string, number[]> = {
  STANDARD: [200, 500, 1000, 2000],
  PRO: [100, 200, 500, 1000],
  ZERO: [100, 200, 500, 1000],
};

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body");
  }
  const type = String(body.type || "STANDARD").toUpperCase();
  if (!["STANDARD", "PRO", "ZERO"].includes(type)) return fail("Invalid account type");

  const allowed = LEVERAGE_BY_TYPE[type] ?? [500];
  const leverage = allowed.includes(Number(body.leverage)) ? Number(body.leverage) : allowed[1] ?? allowed[0];

  const count = await db.account.count({ where: { userId: user.id } });
  if (count >= 5) return fail("Maximum of 5 trading accounts reached");

  const account = await db.account.create({
    data: {
      number: genAccountNumber(),
      type,
      leverage,
      balance: 0,
      userId: user.id,
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      title: "New trading account created",
      body: `Your ${type} account #${account.number} with 1:${leverage} leverage is ready.`,
      type: "SUCCESS",
    },
  });

  return ok({ account: summarizeAccount(account, []) }, 201);
}
