// Production database seeding script
// Run with: node scripts/seed-prod.js
// This is typically run once after deploying to Vercel

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const users = await prisma.user.findFirst();
  if (users) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  console.log('Seeding production database...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@steinweg.be',
      name: 'Admin User',
      password: 'change_me_immediately',
      role: 'admin',
      badge: 'ADM-001',
    },
  });

  console.log('Created admin user:', admin.email);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the default password immediately after first login!');
  console.log('');
  console.log('✅ Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
