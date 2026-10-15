// One-off repair: move the already-booked loss from balance into bonus
// (aligns existing data with the new negative-balance protection rule).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const acc = await db.account.findFirst({ where: { number: "108449845" } });
if (!acc) {
  console.log("account not found");
  process.exit(0);
}
console.log("before:", { balance: acc.balance, bonus: acc.bonus });

if (acc.balance < 0) {
  const shortfall = Math.round(-acc.balance * 100) / 100;
  const absorbed = Math.min(acc.bonus, shortfall);
  await db.account.update({
    where: { id: acc.id },
    data: {
      balance: 0,
      bonus: Math.round((acc.bonus - absorbed) * 100) / 100,
    },
  });
  console.log(`repaired: balance 0, bonus ${Math.round((acc.bonus - absorbed) * 100) / 100} (absorbed ${absorbed})`);
} else {
  console.log("balance not negative — no repair needed");
}
await db.$disconnect();
