/**
 * Prisma seed script — inserts demo data for classroom / development use.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main(): Promise<void> {
  // ── Users ──────────────────────────────────────────────────────────────────
  const alice = await db.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { name: 'Alice Johnson', email: 'alice@example.com' },
  });

  const bob = await db.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { name: 'Bob Smith', email: 'bob@example.com' },
  });

  // ── Cards (fictitious data only) ───────────────────────────────────────────
  const aliceCard = await db.card.upsert({
    where: { fakeToken: 'tok_demo_visa_4242' },
    update: {},
    create: {
      userId: alice.id,
      holderName: 'Alice Johnson',
      last4: '4242',
      brand: 'Visa',
      fakeToken: 'tok_demo_visa_4242',
      expiresAt: new Date('2027-12-31T00:00:00Z'),
    },
  });

  await db.card.upsert({
    where: { fakeToken: 'tok_demo_mc_5353' },
    update: {},
    create: {
      userId: bob.id,
      holderName: 'Bob Smith',
      last4: '5353',
      brand: 'Mastercard',
      fakeToken: 'tok_demo_mc_5353',
      expiresAt: new Date('2028-06-30T00:00:00Z'),
    },
  });

  console.log('✅ Seed completed');
  console.table([
    { entity: 'User', id: alice.id, label: alice.email },
    { entity: 'User', id: bob.id, label: bob.email },
    { entity: 'Card', id: aliceCard.id, label: aliceCard.fakeToken },
  ]);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
