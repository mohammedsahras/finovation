import { db } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const current = String(body.currentPassword || "");
    const next = String(body.newPassword || "");

    if (!verifyPassword(current, user.password)) return fail("Current password is incorrect");
    if (next.length < 8) return fail("New password must be at least 8 characters");
    if (next === current) return fail("New password must be different from the current one");

    await db.user.update({
      where: { id: user.id },
      data: { password: hashPassword(next) },
    });
    return ok({ message: "Password updated successfully" });
  } catch {
    return fail("Failed to change password. Please try again.", 500);
  }
}
