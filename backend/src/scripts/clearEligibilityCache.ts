/**
 * Clear Redis cache for user eligibility
 */

import { PrismaClient } from '@prisma/client';
import { redis, isDisabled } from '../config/redis';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Clearing Eligibility Cache\n');

  // Get all voter user IDs
  const voters = await prisma.user.findMany({
    where: { role: 'VOTER' },
    select: { id: true, email: true },
  });

  console.log(`Found ${voters.length} voters\n`);

  let cleared = 0;

  for (const voter of voters) {
    const cacheKey = `user:${voter.id}:eligible-elections`;

    try {
      await redis?.del(cacheKey);
      console.log(`✅ Cleared cache for: ${voter.email}`);
      cleared++;
    } catch (error) {
      console.log(`⚠️  Failed to clear cache for: ${voter.email}`);
    }
  }

  console.log(`\n✅ Cleared ${cleared} cache entries`);
  console.log('💡 Users will now see updated eligibility on next request\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis?.quit();
  });
