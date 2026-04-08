import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailsToDelete = [
  'mitamboandy@gmail.com',
  'andymwangi3@gmail.com',
  'anderson.mitamboo@gmail.com'
];

async function deleteUsers() {
  console.log('🗑️  Deleting users with specified emails...\n');

  for (const email of emailsToDelete) {
    try {
      // First check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        continue;
      }

      console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);

      const userId = user.id;

      // Delete related records first (cascade may not handle all)
      console.log('  Deleting audit logs...');
      await prisma.auditLog.deleteMany({ where: { userId } });

      console.log('  Deleting votes...');
      await prisma.vote.deleteMany({ where: { voterId: userId } });

      console.log('  Deleting voting sessions...');
      await prisma.votingSession.deleteMany({ where: { voterId: userId } });

      console.log('  Deleting candidates by email...');
      await prisma.candidate.deleteMany({ where: { email } });

      console.log('  Deleting notifications...');
      await prisma.notification.deleteMany({ where: { userId } });

      // Finally delete the user
      console.log('  Deleting user...');
      await prisma.user.delete({ where: { id: userId } });

      console.log(`✅ Deleted: ${email}\n`);
    } catch (error: any) {
      console.error(`❌ Error deleting ${email}:`, error.message);
    }
  }

  console.log('Done!');
}

deleteUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
