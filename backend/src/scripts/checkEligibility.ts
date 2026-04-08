/**
 * Check eligibility for student5 and the election
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const electionId = 'f9e28491-0ad8-4b07-9215-d4644c3aa2fe';

  console.log('🔍 Checking Election Eligibility\n');
  console.log('='.repeat(80));

  // Get student5 details
  const student5 = await prisma.user.findUnique({
    where: { email: 'student5@unielect.com' },
    select: {
      id: true,
      studentId: true,
      email: true,
      firstName: true,
      lastName: true,
      faculty: true,
      department: true,
      course: true,
      yearOfStudy: true,
      admissionYear: true,
      role: true,
    },
  });

  if (!student5) {
    console.log('❌ Student5 not found!');
    return;
  }

  console.log('\n👤 Student5 Profile:');
  console.log(`   Email: ${student5.email}`);
  console.log(`   Name: ${student5.firstName} ${student5.lastName}`);
  console.log(`   Faculty: ${student5.faculty}`);
  console.log(`   Department: ${student5.department}`);
  console.log(`   Course: ${student5.course}`);
  console.log(`   Year of Study: ${student5.yearOfStudy}`);
  console.log(`   Admission Year: ${student5.admissionYear}`);

  // Get election details
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      startDate: true,
      endDate: true,
      eligibleFaculties: true,
      eligibleDepartments: true,
      eligibleCourses: true,
      eligibleYears: true,
      minVoterAge: true,
      maxVoterAge: true,
    },
  });

  if (!election) {
    console.log('\n❌ Election not found!');
    return;
  }

  console.log('\n🗳️  Election Details:');
  console.log(`   Title: ${election.title}`);
  console.log(`   Status: ${election.status}`);
  console.log(`   Type: ${election.type}`);
  console.log(`   Start: ${election.startDate}`);
  console.log(`   End: ${election.endDate}`);

  console.log('\n📋 Eligibility Criteria:');
  console.log(`   Eligible Faculties: ${election.eligibleFaculties ? JSON.stringify(election.eligibleFaculties) : 'NULL (open to all)'}`);
  console.log(`   Eligible Departments: ${election.eligibleDepartments ? JSON.stringify(election.eligibleDepartments) : 'NULL (open to all)'}`);
  console.log(`   Eligible Courses: ${election.eligibleCourses ? JSON.stringify(election.eligibleCourses) : 'NULL (open to all)'}`);
  console.log(`   Eligible Years: ${election.eligibleYears ? JSON.stringify(election.eligibleYears) : 'NULL (open to all)'}`);
  console.log(`   Min Voter Age: ${election.minVoterAge || 'None'}`);
  console.log(`   Max Voter Age: ${election.maxVoterAge || 'None'}`);

  // Check if student matches criteria
  console.log('\n✅ Eligibility Check:');

  const noRestrictions =
    !election.eligibleFaculties &&
    !election.eligibleDepartments &&
    !election.eligibleCourses &&
    !election.eligibleYears;

  if (noRestrictions) {
    console.log('   ✅ ELIGIBLE - Election is open to all students (no restrictions)');
  } else {
    console.log('   ❌ Election has restrictions, checking matches...');

    const facultyMatch = election.eligibleFaculties && election.eligibleFaculties.includes(student5.faculty);
    const departmentMatch = election.eligibleDepartments && election.eligibleDepartments.includes(student5.department);
    const courseMatch = election.eligibleCourses && election.eligibleCourses.includes(student5.course);
    const yearMatch = election.eligibleYears && election.eligibleYears.includes(student5.yearOfStudy);

    console.log(`      Faculty Match: ${facultyMatch ? '✅' : '❌'} (Student: "${student5.faculty}")`);
    console.log(`      Department Match: ${departmentMatch ? '✅' : '❌'} (Student: "${student5.department}")`);
    console.log(`      Course Match: ${courseMatch ? '✅' : '❌'} (Student: "${student5.course}")`);
    console.log(`      Year Match: ${yearMatch ? '✅' : '❌'} (Student: ${student5.yearOfStudy})`);

    if (facultyMatch || departmentMatch || courseMatch || yearMatch) {
      console.log('\n   ✅ ELIGIBLE - Student matches at least one criteria');
    } else {
      console.log('\n   ❌ NOT ELIGIBLE - Student does not match any criteria');
      console.log('\n💡 SOLUTION: Either:');
      console.log('      1. Remove all eligibility restrictions (set all to NULL/empty)');
      console.log('      2. Add student5\'s details to the criteria:');
      console.log(`         - Faculty: "${student5.faculty}"`);
      console.log(`         - Department: "${student5.department}"`);
      console.log(`         - Course: "${student5.course}"`);
      console.log(`         - Year: ${student5.yearOfStudy}`);
    }
  }

  // Check explicit eligibility
  const explicitEligibility = await prisma.voterEligibility.findFirst({
    where: {
      userId: student5.id,
      electionId: electionId,
    },
  });

  if (explicitEligibility) {
    console.log('\n   ✅ Student has explicit eligibility record');
  } else {
    console.log('\n   ℹ️  No explicit eligibility record found');
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
