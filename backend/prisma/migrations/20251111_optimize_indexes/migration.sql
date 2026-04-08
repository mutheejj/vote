-- Optimize indexes for slow queries
-- Migration: 20251111_optimize_indexes

-- ============================================================================
-- USER TABLE OPTIMIZATIONS
-- ============================================================================

-- Add composite index for user eligibility checks (most common query pattern)
CREATE INDEX IF NOT EXISTS "User_faculty_department_yearOfStudy_isActive_idx"
ON "User"("faculty", "department", "yearOfStudy", "isActive", "isVerified");

-- Add composite index for course-based eligibility
CREATE INDEX IF NOT EXISTS "User_course_yearOfStudy_isActive_idx"
ON "User"("course", "yearOfStudy", "isActive", "isVerified");

-- Add index for faster user lookups by faculty
CREATE INDEX IF NOT EXISTS "User_faculty_isActive_isVerified_idx"
ON "User"("faculty", "isActive", "isVerified");

-- Add index for faster user lookups by department
CREATE INDEX IF NOT EXISTS "User_department_isActive_isVerified_idx"
ON "User"("department", "isActive", "isVerified");

-- ============================================================================
-- ELECTION TABLE OPTIMIZATIONS
-- ============================================================================

-- Add composite index for active elections with eligibility criteria
CREATE INDEX IF NOT EXISTS "Election_status_eligibleFaculties_idx"
ON "Election"("status") WHERE array_length("eligibleFaculties", 1) > 0;

-- Add partial index for active elections only (most queried)
CREATE INDEX IF NOT EXISTS "Election_active_status_idx"
ON "Election"("status", "startDate", "endDate")
WHERE "status" IN ('ACTIVE', 'SCHEDULED');

-- Add index for election type and status combination
CREATE INDEX IF NOT EXISTS "Election_type_status_startDate_idx"
ON "Election"("type", "status", "startDate");

-- ============================================================================
-- NOTIFICATION TABLE OPTIMIZATIONS
-- ============================================================================

-- Add composite index for unread notifications (most common query)
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
ON "Notification"("userId", "read", "createdAt" DESC);

-- Add partial index for unread notifications only
CREATE INDEX IF NOT EXISTS "Notification_unread_userId_idx"
ON "Notification"("userId", "createdAt" DESC)
WHERE "read" = false;

-- Add index for notification priority
CREATE INDEX IF NOT EXISTS "Notification_priority_read_idx"
ON "Notification"("priority", "read", "createdAt" DESC);

-- ============================================================================
-- ELECTION NOTIFICATION TABLE OPTIMIZATIONS
-- ============================================================================

-- Add partial index for unsent notifications (heavily queried by scheduler)
CREATE INDEX IF NOT EXISTS "ElectionNotification_unsent_idx"
ON "ElectionNotification"("scheduledFor", "electionId")
WHERE "sent" = false;

-- Add composite index for notification scheduling
CREATE INDEX IF NOT EXISTS "ElectionNotification_electionId_sent_scheduledFor_idx"
ON "ElectionNotification"("electionId", "sent", "scheduledFor");

-- ============================================================================
-- VOTER ELIGIBILITY TABLE OPTIMIZATIONS
-- ============================================================================

-- Add covering index to avoid table lookups
CREATE INDEX IF NOT EXISTS "VoterEligibility_electionId_userId_addedAt_idx"
ON "VoterEligibility"("electionId", "userId", "addedAt");

-- ============================================================================
-- VOTE TABLE OPTIMIZATIONS
-- ============================================================================

-- Add index for vote counting queries
CREATE INDEX IF NOT EXISTS "Vote_electionId_positionId_candidateId_idx"
ON "Vote"("electionId", "positionId", "candidateId")
WHERE "isAbstain" = false;

-- Add index for turnout calculations
CREATE INDEX IF NOT EXISTS "Vote_electionId_voterId_castAt_idx"
ON "Vote"("electionId", "voterId", "castAt");

-- ============================================================================
-- POSITION TABLE OPTIMIZATIONS
-- ============================================================================

-- Add covering index for position queries
CREATE INDEX IF NOT EXISTS "Position_electionId_order_id_idx"
ON "Position"("electionId", "order", "id");

-- ============================================================================
-- CANDIDATE TABLE OPTIMIZATIONS
-- ============================================================================

-- Add composite index for approved candidates
CREATE INDEX IF NOT EXISTS "Candidate_electionId_status_positionId_idx"
ON "Candidate"("electionId", "status", "positionId")
WHERE "status" = 'APPROVED';

-- Add partial index for approved candidates only
CREATE INDEX IF NOT EXISTS "Candidate_approved_idx"
ON "Candidate"("electionId", "positionId", "createdAt")
WHERE "status" = 'APPROVED';

-- ============================================================================
-- AUDIT LOG TABLE OPTIMIZATIONS
-- ============================================================================

-- Add index for audit log queries with time range
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_category_idx"
ON "AuditLog"("userId", "createdAt" DESC, "category");

-- Add index for election audit trail
CREATE INDEX IF NOT EXISTS "AuditLog_electionId_createdAt_idx"
ON "AuditLog"("electionId", "createdAt" DESC);

-- ============================================================================
-- REFRESH TOKEN TABLE OPTIMIZATIONS
-- ============================================================================

-- Add partial index for active tokens
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_active_idx"
ON "RefreshToken"("userId", "expiresAt")
WHERE "revokedAt" IS NULL;
