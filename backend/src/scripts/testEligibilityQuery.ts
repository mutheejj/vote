/**
 * Test the eligibility query with student5's actual data
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Eligibility Query\n');
  console.log('='.repeat(80));

  // Get student5
  const student5 = await prisma.user.findUnique({
    where: { email: 'student5@unielect.com' },
    select: {
      id: true,
      email: true,
      faculty: true,
      department: true,
      course: true,
      yearOfStudy: true,
      admissionYear: true,
    },
  });

  if (!student5) {
    console.log('❌ Student5 not found!');
    return;
  }

  console.log('\n👤 Testing with:');
  console.log(`   Email: ${student5.email}`);
  console.log(`   Faculty: ${student5.faculty}`);
  console.log(`   Department: ${student5.department}`);
  console.log(`   Course: ${student5.course}`);
  console.log(`   Year: ${student5.yearOfStudy}`);

  const now = new Date();
  const currentYear = new Date().getFullYear();
  const userAge = currentYear - student5.admissionYear + 18;

  // Test the exact SQL query from getUserEligibleElections
  const eligibleElections = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT
      e.id,
      e.title,
      e.description,
      e.type,
      e.status,
      e."startDate",
      e."endDate"
    FROM "Election" e
    WHERE e.status = 'ACTIVE'
      AND e."startDate" <= ${now}
      AND e."endDate" >= ${now}
      AND (
        -- Explicit eligibility (none in this case)
        FALSE
        OR
        -- Open to all (no restrictions) - empty arrays or NULL
        (
          (array_length(e."eligibleFaculties", 1) IS NULL OR array_length(e."eligibleFaculties", 1) = 0)
          AND (array_length(e."eligibleDepartments", 1) IS NULL OR array_length(e."eligibleDepartments", 1) = 0)
          AND (array_length(e."eligibleCourses", 1) IS NULL OR array_length(e."eligibleCourses", 1) = 0)
          AND (array_length(e."eligibleYears", 1) IS NULL OR array_length(e."eligibleYears", 1) = 0)
        )
        OR
        -- Match faculty (only check if array has values)
        (array_length(e."eligibleFaculties", 1) > 0 AND ${student5.faculty}::text = ANY(e."eligibleFaculties"))
        OR
        -- Match department (only check if array has values)
        (array_length(e."eligibleDepartments", 1) > 0 AND ${student5.department}::text = ANY(e."eligibleDepartments"))
        OR
        -- Match course (only check if array has values)
        (array_length(e."eligibleCourses", 1) > 0 AND ${student5.course}::text = ANY(e."eligibleCourses"))
        OR
        -- Match year (only check if array has values)
        (array_length(e."eligibleYears", 1) > 0 AND ${student5.yearOfStudy}::integer = ANY(e."eligibleYears"))
      )
      AND (e."minVoterAge" IS NULL OR e."minVoterAge" <= ${userAge})
      AND (e."maxVoterAge" IS NULL OR e."maxVoterAge" >= ${userAge})
    ORDER BY e."endDate" ASC
  `;

  console.log('\n🗳️  Eligible Elections Found:', eligibleElections.length);

  if (eligibleElections.length > 0) {
    console.log('\n✅ SUCCESS! Student5 is eligible for:');
    eligibleElections.forEach((election, i) => {
      console.log(`   ${i + 1}. ${election.title}`);
      console.log(`      Status: ${election.status}`);
      console.log(`      Type: ${election.type}`);
    });
  } else {
    console.log('\n❌ FAILED! No eligible elections found');
    console.log('   This means the SQL query is not working correctly');

    // Debug: Check what the election eligibility looks like
    console.log('\n🔍 Debugging - Checking all active elections:');
    const allActive = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        status,
        "eligibleFaculties",
        "eligibleDepartments",
        "eligibleCourses",
        "eligibleYears",
        array_length("eligibleFaculties", 1) as fac_len,
        array_length("eligibleDepartments", 1) as dept_len,
        array_length("eligibleCourses", 1) as course_len,
        array_length("eligibleYears", 1) as year_len
      FROM "Election"
      WHERE status = 'ACTIVE'
        AND "startDate" <= ${now}
        AND "endDate" >= ${now}
    `;

    allActive.forEach(e => {
      console.log(`\n   Election: ${e.title}`);
      console.log(`      Faculties: ${e.eligibleFaculties} (length: ${e.fac_len})`);
      console.log(`      Departments: ${e.eligibleDepartments} (length: ${e.dept_len})`);
      console.log(`      Courses: ${e.eligibleCourses} (length: ${e.course_len})`);
      console.log(`      Years: ${e.eligibleYears} (length: ${e.year_len})`);
    });
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
