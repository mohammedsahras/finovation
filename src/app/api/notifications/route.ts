import { db } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return ok({ notifications });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await db.notification.updateMany({ where: { id: String(body.id), userId: user.id }, data: { read: true } });
  } else {
    await db.notification.updateMany({ where: { userId: user.id }, data: { read: true } });
  }
  return ok();
}
