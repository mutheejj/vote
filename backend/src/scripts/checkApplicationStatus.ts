/**
 * Check the actual status of a specific application
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const applicationId = 'cmhynnitz00011vjjwazjdb6p'; // Anderson's application

  console.log(`Checking status for application: ${applicationId}\n`);

  const application = await prisma.candidatePreRegistration.findUnique({
    where: { id: applicationId },
    include: {
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      election: {
        select: {
          title: true,
          status: true
        }
      },
      position: {
        select: {
          name: true
        }
      }
    }
  });

  if (!application) {
    console.log('❌ Application not found!');
    return;
  }

  console.log('📋 Application Details:');
  console.log('='.repeat(60));
  console.log(`ID: ${application.id}`);
  console.log(`Name: ${application.firstName} ${application.lastName}`);
  console.log(`Email: ${application.email}`);
  console.log(`Student ID: ${application.studentId}`);
  console.log(`\n🎯 Status: ${application.status}`);
  console.log(`\nElection: ${application.election?.title || 'N/A'}`);
  console.log(`Position: ${application.position?.name || application.intendedPosition}`);
  console.log(`\n⏱️  Timeline:`);
  console.log(`Created: ${application.createdAt}`);
  console.log(`Updated: ${application.updatedAt}`);

  if (application.reviewedAt) {
    console.log(`Reviewed: ${application.reviewedAt}`);
    console.log(`Reviewed by: ${application.reviewer?.firstName} ${application.reviewer?.lastName}`);
  }

  if (application.approvalToken) {
    console.log(`\n🔑 Approval Token: ${application.approvalToken.substring(0, 10)}...`);
    console.log(`Token Expiry: ${application.tokenExpiry}`);

    const now = new Date();
    const expired = application.tokenExpiry && new Date(application.tokenExpiry) < now;
    console.log(`Token Status: ${expired ? '❌ EXPIRED' : '✅ VALID'}`);
  }

  if (application.reviewNotes) {
    console.log(`\n📝 Review Notes: ${application.reviewNotes}`);
  }

  if (application.rejectionReason) {
    console.log(`\n❌ Rejection Reason: ${application.rejectionReason}`);
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
