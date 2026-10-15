import { db } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // DEPOSIT | WITHDRAWAL | null
  const where: { userId: string; type?: string } = { userId: user.id };
  if (type === "DEPOSIT" || type === "WITHDRAWAL") where.type = type;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { account: { select: { number: true, type: true } } },
  });
  return ok({ transactions });
}
