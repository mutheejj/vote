/**
 * Check election status and timing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const electionId = 'f9e28491-0ad8-4b07-9215-d4644c3aa2fe';

  console.log('🔍 Checking Election Status & Timing\n');
  console.log('='.repeat(80));

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      eligibleFaculties: true,
      eligibleDepartments: true,
      eligibleCourses: true,
      eligibleYears: true,
    },
  });

  if (!election) {
    console.log('❌ Election not found!');
    return;
  }

  const now = new Date();

  console.log('\n🗳️  Election:', election.title);
  console.log(`\n📅 Timing:`);
  console.log(`   Current Time: ${now.toISOString()}`);
  console.log(`   Start Date:   ${election.startDate.toISOString()}`);
  console.log(`   End Date:     ${election.endDate.toISOString()}`);
  console.log(`\n   Started: ${now >= election.startDate ? '✅ YES' : '❌ NO (too early)'}`);
  console.log(`   Not Ended: ${now <= election.endDate ? '✅ YES' : '❌ NO (already ended)'}`);

  console.log(`\n📊 Status: ${election.status}`);
  console.log(`   Is ACTIVE: ${election.status === 'ACTIVE' ? '✅ YES' : '❌ NO'}`);

  console.log(`\n📋 Eligibility (should be NULL):`);
  console.log(`   Faculties: ${election.eligibleFaculties}`);
  console.log(`   Departments: ${election.eligibleDepartments}`);
  console.log(`   Courses: ${election.eligibleCourses}`);
  console.log(`   Years: ${election.eligibleYears}`);

  const meetsAllCriteria =
    election.status === 'ACTIVE' &&
    now >= election.startDate &&
    now <= election.endDate;

  if (meetsAllCriteria) {
    console.log('\n✅ Election meets all criteria for voting!');
  } else {
    console.log('\n❌ Election does NOT meet criteria:');
    if (election.status !== 'ACTIVE') {
      console.log(`   - Status is "${election.status}" instead of "ACTIVE"`);
    }
    if (now < election.startDate) {
      const minsUntilStart = Math.floor((election.startDate.getTime() - now.getTime()) / 60000);
      console.log(`   - Starts in ${minsUntilStart} minutes`);
    }
    if (now > election.endDate) {
      const minsAgo = Math.floor((now.getTime() - election.endDate.getTime()) / 60000);
      console.log(`   - Ended ${minsAgo} minutes ago`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
