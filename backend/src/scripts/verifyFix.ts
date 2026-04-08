/**
 * Verify the eligibility fix worked
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const electionId = 'f9e28491-0ad8-4b07-9215-d4644c3aa2fe';

  console.log('🔍 Verifying Database Fix\n');
  console.log('='.repeat(80));

  // Check using raw SQL to see actual NULL values
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      title,
      "eligibleFaculties",
      "eligibleDepartments",
      "eligibleCourses",
      "eligibleYears",
      "eligibleFaculties" IS NULL as "facultiesIsNull",
      "eligibleDepartments" IS NULL as "departmentsIsNull",
      "eligibleCourses" IS NULL as "coursesIsNull",
      "eligibleYears" IS NULL as "yearsIsNull"
    FROM "Election"
    WHERE id = ${electionId}::text
  `;

  if (result.length === 0) {
    console.log('❌ Election not found!');
    return;
  }

  const election = result[0];

  console.log('\n🗳️  Election:', election.title);
  console.log('\n📋 Database Values (RAW):');
  console.log(`   eligibleFaculties: ${election.eligibleFaculties} (IS NULL: ${election.facultiesIsNull})`);
  console.log(`   eligibleDepartments: ${election.eligibleDepartments} (IS NULL: ${election.departmentsIsNull})`);
  console.log(`   eligibleCourses: ${election.eligibleCourses} (IS NULL: ${election.coursesIsNull})`);
  console.log(`   eligibleYears: ${election.eligibleYears} (IS NULL: ${election.yearsIsNull})`);

  const allNull = election.facultiesIsNull && election.departmentsIsNull &&
                  election.coursesIsNull && election.yearsIsNull;

  if (allNull) {
    console.log('\n✅ SUCCESS! All eligibility criteria are NULL - election is open to all students');
  } else {
    console.log('\n⚠️  Some criteria are not NULL - election still has restrictions');
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
