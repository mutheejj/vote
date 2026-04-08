const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('Test1234', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'apitest@jkuat.ac.ke' },
      update: { password: hashedPassword },
      create: {
        studentId: 'TST456-7890/2024',
        email: 'apitest@jkuat.ac.ke',
        password: hashedPassword,
        firstName: 'API',
        lastName: 'Tester',
        role: 'VOTER',
        isVerified: true,
        isActive: true,
        yearOfStudy: 3,
        admissionYear: 2024,
        faculty: 'Engineering',
        department: 'Computer Science',
        course: 'Computer Science'
      }
    });
    
    console.log('✓ Test user ready!');
    console.log('Email: apitest@jkuat.ac.ke');
    console.log('Password: Test1234');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
