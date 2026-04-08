const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    const user = await prisma.user.create({
      data: {
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
    
    console.log('✓ Test user created successfully!');
    console.log('Email: apitest@jkuat.ac.ke');
    console.log('Password: Password123!');
    console.log('Student ID: TST456-7890/2024');
    
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
