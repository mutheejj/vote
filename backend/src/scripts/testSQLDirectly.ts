/**
 * Test the SQL eligibility condition directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const electionId = 'f9e28491-0ad8-4b07-9215-d4644c3aa2fe';
  const now = new Date();

  console.log('🧪 Testing SQL Eligibility Logic\n');
  console.log('='.repeat(80));

  // Test each condition separately
  console.log('\n1️⃣  Testing: Election is ACTIVE and within time range');
  const activeElections = await prisma.$queryRaw<any[]>`
    SELECT id, title, status, "startDate", "endDate"
    FROM "Election"
    WHERE status = 'ACTIVE'
      AND "startDate" <= ${now}
      AND "endDate" >= ${now}
      AND id = ${electionId}::text
  `;
  console.log(`   Result: ${activeElections.length > 0 ? '✅ PASS' : '❌ FAIL'}`);
  if (activeElections.length > 0) {
    console.log(`   Found: ${activeElections[0].title}`);
  }

  console.log('\n2️⃣  Testing: array_length checks for NULL eligibility');
  const nullCheck = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      title,
      array_length("eligibleFaculties", 1) as fac_len,
      array_length("eligibleDepartments", 1) as dept_len,
      array_length("eligibleCourses", 1) as course_len,
      array_length("eligibleYears", 1) as year_len,
      (array_length("eligibleFaculties", 1) IS NULL OR array_length("eligibleFaculties", 1) = 0) as fac_check,
      (array_length("eligibleDepartments", 1) IS NULL OR array_length("eligibleDepartments", 1) = 0) as dept_check,
      (array_length("eligibleCourses", 1) IS NULL OR array_length("eligibleCourses", 1) = 0) as course_check,
      (array_length("eligibleYears", 1) IS NULL OR array_length("eligibleYears", 1) = 0) as year_check
    FROM "Election"
    WHERE id = ${electionId}::text
  `;

  if (nullCheck.length > 0) {
    const e = nullCheck[0];
    console.log(`   Faculties length: ${e.fac_len} → Check passes: ${e.fac_check ? '✅' : '❌'}`);
    console.log(`   Departments length: ${e.dept_len} → Check passes: ${e.dept_check ? '✅' : '❌'}`);
    console.log(`   Courses length: ${e.course_len} → Check passes: ${e.course_check ? '✅' : '❌'}`);
    console.log(`   Years length: ${e.year_len} → Check passes: ${e.year_check ? '✅' : '❌'}`);

    const allPass = e.fac_check && e.dept_check && e.course_check && e.year_check;
    console.log(`   All checks pass: ${allPass ? '✅ YES' : '❌ NO'}`);
  }

  console.log('\n3️⃣  Testing: Full eligibility condition (open to all)');
  const openToAll = await prisma.$queryRaw<any[]>`
    SELECT id, title
    FROM "Election"
    WHERE id = ${electionId}::text
      AND (
        (array_length("eligibleFaculties", 1) IS NULL OR array_length("eligibleFaculties", 1) = 0)
        AND (array_length("eligibleDepartments", 1) IS NULL OR array_length("eligibleDepartments", 1) = 0)
        AND (array_length("eligibleCourses", 1) IS NULL OR array_length("eligibleCourses", 1) = 0)
        AND (array_length("eligibleYears", 1) IS NULL OR array_length("eligibleYears", 1) = 0)
      )
  `;
  console.log(`   Result: ${openToAll.length > 0 ? '✅ PASS - Election is open to all' : '❌ FAIL - Condition not met'}`);

  console.log('\n4️⃣  Testing: Complete query (as used in getUserEligibleElections)');
  const completeQuery = await prisma.$queryRaw<any[]>`
    SELECT id, title
    FROM "Election" e
    WHERE e.status = 'ACTIVE'
      AND e."startDate" <= ${now}
      AND e."endDate" >= ${now}
      AND e.id = ${electionId}::text
      AND (
        FALSE
        OR
        (
          (array_length(e."eligibleFaculties", 1) IS NULL OR array_length(e."eligibleFaculties", 1) = 0)
          AND (array_length(e."eligibleDepartments", 1) IS NULL OR array_length(e."eligibleDepartments", 1) = 0)
          AND (array_length(e."eligibleCourses", 1) IS NULL OR array_length(e."eligibleCourses", 1) = 0)
          AND (array_length(e."eligibleYears", 1) IS NULL OR array_length(e."eligibleYears", 1) = 0)
        )
      )
  `;
  console.log(`   Result: ${completeQuery.length > 0 ? '✅ PASS - Election found!' : '❌ FAIL - Election not found'}`);

  console.log('\n' + '='.repeat(80));

  if (completeQuery.length === 0) {
    console.log('\n❌ PROBLEM: The complete query is not working!');
    console.log('Let me check if there\'s a syntax issue or other problem...\n');
  } else {
    console.log('\n✅ SUCCESS! The SQL query is working correctly!');
    console.log('The issue must be elsewhere (maybe code not reloaded?)\n');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
