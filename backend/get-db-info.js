const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function getDatabaseInfo() {
  console.log('Gathering database information...\n');

  let output = '';

  try {
    // 1. Get all indexes
    output += '========================================\n';
    output += 'ALL DATABASE INDEXES\n';
    output += '========================================\n\n';

    const allIndexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    allIndexes.forEach(idx => {
      output += `Table: ${idx.tablename}\n`;
      output += `Index: ${idx.indexname}\n`;
      output += `Definition: ${idx.indexdef}\n\n`;
    });

    // 2. Get table sizes
    output += '\n========================================\n';
    output += 'TABLE SIZES\n';
    output += '========================================\n\n';

    const sizes = await prisma.$queryRaw`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size('"public"."' || tablename || '"')) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('"public"."' || tablename || '"') DESC
      LIMIT 20;
    `;

    sizes.forEach(s => {
      output += `${s.tablename}: ${s.size}\n`;
    });

    // 3. Get SystemStats data
    output += '\n========================================\n';
    output += 'SYSTEMSTATS DATA\n';
    output += '========================================\n\n';

    const stats = await prisma.systemStats.findMany({
      orderBy: { key: 'asc' }
    });

    stats.forEach(s => {
      output += `${s.key}: ${JSON.stringify(s.value)}\n`;
    });

    // 4. Get record counts
    output += '\n========================================\n';
    output += 'RECORD COUNTS\n';
    output += '========================================\n\n';

    const counts = await prisma.$queryRaw`
      SELECT
        (SELECT COUNT(*) FROM "User") as users,
        (SELECT COUNT(*) FROM "Election") as elections,
        (SELECT COUNT(*) FROM "Vote") as votes,
        (SELECT COUNT(*) FROM "Candidate") as candidates,
        (SELECT COUNT(*) FROM "Position") as positions,
        (SELECT COUNT(*) FROM "ElectionNotification") as notifications;
    `;

    const count = counts[0];
    output += `Users: ${count.users}\n`;
    output += `Elections: ${count.elections}\n`;
    output += `Votes: ${count.votes}\n`;
    output += `Candidates: ${count.candidates}\n`;
    output += `Positions: ${count.positions}\n`;
    output += `Notifications: ${count.notifications}\n`;

    // Write to file
    fs.writeFileSync('database_dump_info.txt', output);

    console.log('✓ Database information saved to database_dump_info.txt');

  } catch (error) {
    console.error('Error:', error.message);
    output += '\n\nERROR: ' + error.message + '\n' + error.stack;
    fs.writeFileSync('database_dump_info.txt', output);
  } finally {
    await prisma.$disconnect();
  }
}

getDatabaseInfo();
