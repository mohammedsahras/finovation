import { db } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

/** Update profile info. */
export async function PUT(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);

  try {
    const body = await req.json();
    const fullName = String(body.fullName ?? user.fullName).trim();
    const phone = body.phone != null ? String(body.phone).trim() : user.phone;
    const country = body.country != null ? String(body.country).trim() : user.country;

    if (fullName.length < 2) return fail("Name must be at least 2 characters");

    const updated = await db.user.update({
      where: { id: user.id },
      data: { fullName, phone, country },
    });
    return ok({
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone,
        country: updated.country,
        verified: updated.verified,
        createdAt: updated.createdAt,
      },
    });
  } catch {
    return fail("Failed to update profile. Please try again.", 500);
  }
}
