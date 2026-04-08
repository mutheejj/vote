// Script to delete all voter (student) accounts and candidate records
// Run with: npx ts-node scripts/cleanup-voters-candidates.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupVotersAndCandidates() {
  console.log('🗑️  Starting cleanup process...\n');

  try {
    // Start a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      // 1. Delete all candidate pre-registration records
      console.log('📋 Deleting candidate pre-registration records...');
      const deletedPreRegs = await tx.candidatePreRegistration.deleteMany({});
      console.log(`   ✅ Deleted ${deletedPreRegs.count} candidate pre-registration records\n`);

      // 2. Delete all candidates
      console.log('🎓 Deleting all candidate records...');
      const deletedCandidates = await tx.candidate.deleteMany({});
      console.log(`   ✅ Deleted ${deletedCandidates.count} candidate records\n`);

      // 3. Delete all campaigns (should be cascade deleted with candidates, but just in case)
      console.log('📢 Deleting all campaign records...');
      const deletedCampaigns = await tx.campaign.deleteMany({});
      console.log(`   ✅ Deleted ${deletedCampaigns.count} campaign records\n`);

      // 4. Get count of voter accounts before deletion
      const voterCount = await tx.user.count({
        where: { role: 'VOTER' }
      });
      console.log(`👥 Found ${voterCount} voter accounts to delete...\n`);

      // 5. Delete all voter (student) accounts
      // This will CASCADE delete:
      // - votes, voting sessions, notifications, audit logs,
      // - refresh tokens, verification tokens, preferences,
      // - social media, achievements, etc.
      console.log('🔥 Deleting all voter accounts (this will cascade delete related data)...');
      const deletedVoters = await tx.user.deleteMany({
        where: { role: 'VOTER' }
      });
      console.log(`   ✅ Deleted ${deletedVoters.count} voter accounts\n`);

      // 6. Delete orphaned voter eligibility records (if any)
      console.log('🔍 Cleaning up voter eligibility records...');
      const deletedEligibility = await tx.voterEligibility.deleteMany({});
      console.log(`   ✅ Deleted ${deletedEligibility.count} voter eligibility records\n`);
    });

    console.log('✨ Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log('- All voter (student) accounts deleted');
    console.log('- All candidate records deleted');
    console.log('- All candidate pre-registration records deleted');
    console.log('- All associated data (votes, sessions, notifications, etc.) deleted via CASCADE\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupVotersAndCandidates()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
