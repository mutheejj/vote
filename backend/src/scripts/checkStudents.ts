/**
 * Check seeded students in the database
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking seeded students in database...\n');

  // Get all students (voters)
  const students = await prisma.user.findMany({
    where: {
      role: 'VOTER'
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      firstName: true,
      lastName: true,
      password: true, // We'll verify the hash
      isActive: true,
      isVerified: true,
      emailVerified: true,
      createdAt: true
    },
    orderBy: {
      email: 'asc'
    }
  });

  if (students.length === 0) {
    console.log('❌ No students found in database!');
    console.log('💡 You may need to run the seed script:');
    console.log('   npm run seed\n');
    return;
  }

  console.log(`✅ Found ${students.length} student(s) in database:\n`);
  console.log('='.repeat(80));

  for (const student of students) {
    console.log(`\n📧 Email: ${student.email}`);
    console.log(`   Student ID: ${student.studentId}`);
    console.log(`   Name: ${student.firstName} ${student.lastName}`);
    console.log(`   Active: ${student.isActive ? '✅' : '❌'}`);
    console.log(`   Verified: ${student.isVerified ? '✅' : '❌'}`);
    console.log(`   Email Verified: ${student.emailVerified ? '✅' : '❌'}`);
    console.log(`   Created: ${student.createdAt}`);

    // Test password hash
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, student.password);
    console.log(`   Password Test (admin123): ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);

    // Also test common variations
    if (!isPasswordValid) {
      const variations = ['Admin123', 'ADMIN123', 'password', 'student123'];
      for (const pwd of variations) {
        const isValid = await bcrypt.compare(pwd, student.password);
        if (isValid) {
          console.log(`   ⚠️  Actual password is: "${pwd}"`);
          break;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔐 Login Credentials to Use:');
  console.log('   Email: student1@unielect.com');
  console.log('   Password: admin123');
  console.log('\n   Or any student2 to student5 with the same password\n');

  // Also check admins
  console.log('\n👥 Admin Accounts:');
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN']
      }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      password: true
    }
  });

  for (const admin of admins) {
    const isPasswordValid = await bcrypt.compare('admin123', admin.password);
    console.log(`   ${admin.role}: ${admin.email} (${admin.firstName} ${admin.lastName})`);
    console.log(`      Password Test: ${isPasswordValid ? '✅ admin123' : '❌ NOT admin123'}`);
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
