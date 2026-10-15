import { db } from "@/lib/db";
import { ok, fail, requireUser, summarizeAccount, processSlTp } from "@/lib/api";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  // Process SL/TP triggers on every poll
  await processSlTp(user.id);

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    include: {
      accounts: { orderBy: { createdAt: "asc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
  if (!fresh) return fail("Unauthorized", 401);

  const trades = await db.trade.findMany({ where: { userId: user.id, status: "OPEN" } });
  const summaries = fresh.accounts.map((acc) =>
    summarizeAccount(
      acc,
      trades.filter((t) => t.accountId === acc.id)
    )
  );

  return ok({
    user: {
      id: fresh.id,
      email: fresh.email,
      fullName: fresh.fullName,
      phone: fresh.phone,
      country: fresh.country,
      verified: fresh.verified,
      kycLevel: fresh.kycLevel,
      createdAt: fresh.createdAt,
    },
    accounts: summaries,
    notifications: fresh.notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
    })),
  });
}
