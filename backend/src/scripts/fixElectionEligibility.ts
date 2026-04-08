/**
 * Fix election eligibility - convert empty arrays to NULL using raw SQL
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Election Eligibility Criteria\n');

  // Find all elections with empty array eligibility criteria
  const elections = await prisma.election.findMany({
    select: {
      id: true,
      title: true,
      eligibleFaculties: true,
      eligibleDepartments: true,
      eligibleCourses: true,
      eligibleYears: true,
    },
  });

  let fixed = 0;

  for (const election of elections) {
    const needsUpdate =
      (Array.isArray(election.eligibleFaculties) && election.eligibleFaculties.length === 0) ||
      (Array.isArray(election.eligibleDepartments) && election.eligibleDepartments.length === 0) ||
      (Array.isArray(election.eligibleCourses) && election.eligibleCourses.length === 0) ||
      (Array.isArray(election.eligibleYears) && election.eligibleYears.length === 0);

    if (needsUpdate) {
      console.log(`Fixing: ${election.title}`);
      console.log(`   Before:`);
      console.log(`      Faculties: ${JSON.stringify(election.eligibleFaculties)}`);
      console.log(`      Departments: ${JSON.stringify(election.eligibleDepartments)}`);
      console.log(`      Courses: ${JSON.stringify(election.eligibleCourses)}`);
      console.log(`      Years: ${JSON.stringify(election.eligibleYears)}`);

      // Use raw SQL to set empty arrays to NULL
      // Note: In PostgreSQL, array_length returns NULL for empty arrays, so we check cardinality
      await prisma.$executeRaw`
        UPDATE "Election"
        SET
          "eligibleFaculties" = CASE WHEN cardinality("eligibleFaculties") = 0 THEN NULL ELSE "eligibleFaculties" END,
          "eligibleDepartments" = CASE WHEN cardinality("eligibleDepartments") = 0 THEN NULL ELSE "eligibleDepartments" END,
          "eligibleCourses" = CASE WHEN cardinality("eligibleCourses") = 0 THEN NULL ELSE "eligibleCourses" END,
          "eligibleYears" = CASE WHEN cardinality("eligibleYears") = 0 THEN NULL ELSE "eligibleYears" END
        WHERE id = ${election.id}::text
      `;

      console.log(`   After: All empty arrays → NULL (open to all) ✅\n`);
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log('✅ No elections need fixing - all eligibility criteria are properly set');
  } else {
    console.log(`\n✅ Fixed ${fixed} election(s)`);
    console.log('💡 Elections with NULL eligibility criteria are now open to all students\n');
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
