/**
 * Initialize SystemStats table with current counts
 * Run this script to populate the stats cache
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Initializing SystemStats...\n');

  try {
    // Count current data
    const [
      totalUsers,
      verifiedUsers,
      activeUsers,
      totalElections,
      activeElections,
      scheduledElections,
      draftElections,
      completedElections,
      totalCandidates,
      approvedCandidates,
      pendingCandidates,
      totalVotes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.election.count(),
      prisma.election.count({ where: { status: 'ACTIVE' } }),
      prisma.election.count({ where: { status: 'SCHEDULED' } }),
      prisma.election.count({ where: { status: 'DRAFT' } }),
      prisma.election.count({ where: { status: 'COMPLETED' } }),
      prisma.candidate.count(),
      prisma.candidate.count({ where: { status: 'APPROVED' } }),
      prisma.candidate.count({ where: { status: 'PENDING' } }),
      prisma.vote.count(),
    ]);

    console.log('📊 Current counts:');
    console.log(`   Users: ${totalUsers} (${verifiedUsers} verified, ${activeUsers} active)`);
    console.log(`   Elections: ${totalElections} (${activeElections} active, ${scheduledElections} scheduled, ${draftElections} draft, ${completedElections} completed)`);
    console.log(`   Candidates: ${totalCandidates} (${approvedCandidates} approved, ${pendingCandidates} pending)`);
    console.log(`   Votes: ${totalVotes}\n`);

    // Create stats array
    const stats = [
      { key: 'total_users', count: totalUsers },
      { key: 'verified_users', count: verifiedUsers },
      { key: 'active_users', count: activeUsers },
      { key: 'total_elections', count: totalElections },
      { key: 'active_elections', count: activeElections },
      { key: 'scheduled_elections', count: scheduledElections },
      { key: 'draft_elections', count: draftElections },
      { key: 'completed_elections', count: completedElections },
      { key: 'total_candidates', count: totalCandidates },
      { key: 'approved_candidates', count: approvedCandidates },
      { key: 'pending_candidates', count: pendingCandidates },
      { key: 'total_votes', count: totalVotes },
    ];

    // Upsert all stats
    console.log('💾 Upserting stats to SystemStats table...');
    for (const stat of stats) {
      await prisma.systemStats.upsert({
        where: { key: stat.key },
        update: {
          value: { count: stat.count, timestamp: new Date() },
          updatedAt: new Date(),
        },
        create: {
          key: stat.key,
          value: { count: stat.count, timestamp: new Date() },
        },
      });
      console.log(`   ✅ ${stat.key}: ${stat.count}`);
    }

    console.log('\n✨ SystemStats initialized successfully!');
    console.log('🎯 Database triggers will keep these stats updated automatically.');
  } catch (error) {
    console.error('❌ Error initializing stats:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
