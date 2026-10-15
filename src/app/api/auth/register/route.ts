import { db } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { ok, fail, genAccountNumber } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const country = body.country ? String(body.country).trim() : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email address");
    if (password.length < 8) return fail("Password must be at least 8 characters");
    if (fullName.length < 2) return fail("Please enter your full name");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("An account with this email already exists");

    const user = await db.user.create({
      data: {
        email,
        password: hashPassword(password),
        fullName,
        phone,
        country,
        accounts: {
          create: {
            number: genAccountNumber(),
            type: "STANDARD",
            leverage: 500,
            balance: 0,
          },
        },
      },
      include: { accounts: true },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Finovation",
        body: "Your Standard trading account is ready. Make your first deposit to start trading.",
        type: "INFO",
      },
    });

    const token = createToken(user.id);
    return ok({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName },
      accountNumber: user.accounts[0]?.number,
    });
  } catch {
    return fail("Registration failed. Please try again.", 500);
  }
}
