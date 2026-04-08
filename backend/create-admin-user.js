const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('Admin1234', 12);
    
    const admin = await prisma.user.create({
      data: {
        studentId: 'ADM002-0002/2024',
        email: 'admin@jkuat.ac.ke',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        yearOfStudy: 4,
        admissionYear: 2024,
        faculty: 'Administration',
        department: 'IT',
        course: 'Administration',
        permissions: ['CREATE_ELECTION', 'MANAGE_USERS', 'VIEW_REPORTS']
      }
    });
    
    console.log('✓ Admin user created!');
    console.log('Email: admin@jkuat.ac.ke');
    console.log('Password: Admin1234');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
