/**
 * Database Performance Check Script
 * This script checks indexes, query performance, and provides recommendations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 DATABASE PERFORMANCE CHECK\n');
  console.log('=' .repeat(60));

  // 1. Check Election table indexes
  console.log('\n📊 CHECKING ELECTION TABLE INDEXES...\n');

  const indexes = await prisma.$queryRaw<any[]>`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'Election'
    ORDER BY indexname;
  `;

  console.log(`Found ${indexes.length} indexes on Election table:`);
  indexes.forEach((idx, i) => {
    console.log(`\n${i + 1}. ${idx.indexname}`);
    console.log(`   ${idx.indexdef}`);
  });

  // 2. Check if createdAt index exists
  console.log('\n\n🔎 CHECKING FOR MISSING INDEXES...\n');

  const hasCreatedAtIndex = indexes.some(idx =>
    idx.indexname.includes('createdAt') || idx.indexdef.includes('createdAt')
  );

  if (!hasCreatedAtIndex) {
    console.log('❌ MISSING: Index on createdAt column');
    console.log('   This is likely causing the slow query!');
    console.log('   The query uses ORDER BY "createdAt" DESC');
  } else {
    console.log('✅ createdAt index exists');
  }

  // 3. Test query performance
  console.log('\n\n⏱️  TESTING QUERY PERFORMANCE...\n');

  const start1 = Date.now();
  const elections = await prisma.election.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const duration1 = Date.now() - start1;

  console.log(`Simple query (no joins): ${duration1}ms`);
  console.log(`Returned ${elections.length} elections`);

  const start2 = Date.now();
  const electionsWithJoins = await prisma.election.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      positions: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const duration2 = Date.now() - start2;

  console.log(`With joins (createdBy + positions): ${duration2}ms`);

  // 4. Check Position table indexes
  console.log('\n\n📋 CHECKING POSITION TABLE INDEXES...\n');

  const positionIndexes = await prisma.$queryRaw<any[]>`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'Position'
    ORDER BY indexname;
  `;

  console.log(`Found ${positionIndexes.length} indexes on Position table:`);
  positionIndexes.forEach((idx, i) => {
    console.log(`${i + 1}. ${idx.indexname}`);
  });

  // 5. Check table sizes
  console.log('\n\n📦 TABLE SIZES...\n');

  const tableSizes = await prisma.$queryRaw<any[]>`
    SELECT
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS indexes_size
    FROM pg_catalog.pg_statio_user_tables
    WHERE relname IN ('Election', 'Position', 'User', 'Candidate', 'Vote')
    ORDER BY pg_total_relation_size(relid) DESC;
  `;

  tableSizes.forEach(table => {
    console.log(`${table.table_name}:`);
    console.log(`  Total: ${table.total_size}, Table: ${table.table_size}, Indexes: ${table.indexes_size}`);
  });

  // 6. Recommendations
  console.log('\n\n💡 RECOMMENDATIONS...\n');

  if (!hasCreatedAtIndex) {
    console.log('❗ CRITICAL: Add index on Election.createdAt');
    console.log('   Run this migration:');
    console.log('   CREATE INDEX "Election_createdAt_idx" ON "Election"("createdAt" DESC);');
  }

  if (duration1 > 50) {
    console.log(`⚠️  Simple query is slow (${duration1}ms). Check database connection.`);
  }

  if (duration2 > 200) {
    console.log(`⚠️  Query with joins is slow (${duration2}ms).`);
    console.log('   Consider:');
    console.log('   1. Adding indexes on foreign keys');
    console.log('   2. Using query caching');
    console.log('   3. Limiting data in select statements');
  }

  // 7. Check for queries that might benefit from indexes
  console.log('\n\n🎯 QUERY PATTERN ANALYSIS...\n');

  const electionCount = await prisma.election.count();
  const positionCount = await prisma.position.count();
  const candidateCount = await prisma.candidate.count();

  console.log(`Elections: ${electionCount}`);
  console.log(`Positions: ${positionCount}`);
  console.log(`Candidates: ${candidateCount}`);

  if (electionCount > 0) {
    const avgPositionsPerElection = positionCount / electionCount;
    console.log(`\nAverage positions per election: ${avgPositionsPerElection.toFixed(2)}`);

    if (avgPositionsPerElection > 5) {
      console.log('💡 Consider using pagination for positions in list views');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Performance check complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
