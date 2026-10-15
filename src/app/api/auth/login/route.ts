import { db } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) return fail("Email and password are required");

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return fail("Invalid email or password", 401);
    }

    const token = createToken(user.id);
    return ok({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch {
    return fail("Login failed. Please try again.", 500);
  }
}
