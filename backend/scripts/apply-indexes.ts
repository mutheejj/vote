import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyIndexes() {
  console.log('🔧 Applying query optimization indexes...');

  try {
    // User table optimizations
    console.log('📊 Optimizing User table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_faculty_department_yearOfStudy_isActive_idx"
      ON "User"("faculty", "department", "yearOfStudy", "isActive", "isVerified");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_course_yearOfStudy_isActive_idx"
      ON "User"("course", "yearOfStudy", "isActive", "isVerified");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_faculty_isActive_isVerified_idx"
      ON "User"("faculty", "isActive", "isVerified");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_department_isActive_isVerified_idx"
      ON "User"("department", "isActive", "isVerified");
    `);

    // Election table optimizations
    console.log('📊 Optimizing Election table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Election_active_status_idx"
      ON "Election"("status", "startDate", "endDate")
      WHERE "status" IN ('ACTIVE', 'SCHEDULED');
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Election_type_status_startDate_idx"
      ON "Election"("type", "status", "startDate");
    `);

    // Notification optimizations
    console.log('📊 Optimizing Notification table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_read_createdAt_idx"
      ON "Notification"("userId", "read", "createdAt" DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_unread_userId_idx"
      ON "Notification"("userId", "createdAt" DESC)
      WHERE "read" = false;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_priority_read_idx"
      ON "Notification"("priority", "read", "createdAt" DESC);
    `);

    // ElectionNotification optimizations
    console.log('📊 Optimizing ElectionNotification table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "ElectionNotification_unsent_idx"
      ON "ElectionNotification"("scheduledFor", "electionId")
      WHERE "sent" = false;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "ElectionNotification_electionId_sent_scheduledFor_idx"
      ON "ElectionNotification"("electionId", "sent", "scheduledFor");
    `);

    // VoterEligibility optimizations
    console.log('📊 Optimizing VoterEligibility table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "VoterEligibility_electionId_userId_addedAt_idx"
      ON "VoterEligibility"("electionId", "userId", "addedAt");
    `);

    // Vote optimizations
    console.log('📊 Optimizing Vote table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Vote_electionId_positionId_candidateId_idx"
      ON "Vote"("electionId", "positionId", "candidateId")
      WHERE "isAbstain" = false;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Vote_electionId_voterId_castAt_idx"
      ON "Vote"("electionId", "voterId", "castAt");
    `);

    // Position optimizations
    console.log('📊 Optimizing Position table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Position_electionId_order_id_idx"
      ON "Position"("electionId", "order", "id");
    `);

    // Candidate optimizations
    console.log('📊 Optimizing Candidate table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Candidate_electionId_status_positionId_idx"
      ON "Candidate"("electionId", "status", "positionId")
      WHERE "status" = 'APPROVED';
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Candidate_approved_idx"
      ON "Candidate"("electionId", "positionId", "createdAt")
      WHERE "status" = 'APPROVED';
    `);

    // AuditLog optimizations
    console.log('📊 Optimizing AuditLog table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_userId_createdAt_category_idx"
      ON "AuditLog"("userId", "createdAt" DESC, "category");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_electionId_createdAt_idx"
      ON "AuditLog"("electionId", "createdAt" DESC);
    `);

    // RefreshToken optimizations
    console.log('📊 Optimizing RefreshToken table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "RefreshToken_userId_active_idx"
      ON "RefreshToken"("userId", "expiresAt")
      WHERE "revokedAt" IS NULL;
    `);

    console.log('✅ All indexes applied successfully!');
    console.log('🚀 Query performance should be significantly improved.');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Some indexes already exist, skipping...');
    } else {
      console.error('❌ Error applying indexes:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes()
  .then(() => {
    console.log('✨ Index optimization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to apply indexes:', error);
    process.exit(1);
  });
