-- Add SystemStats table for caching counts and statistics
CREATE TABLE "SystemStats" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3)
);

-- Create index on key for fast lookups
CREATE INDEX "SystemStats_key_idx" ON "SystemStats"("key");
CREATE INDEX "SystemStats_expiresAt_idx" ON "SystemStats"("expiresAt");

-- Add indexes for frequently queried fields to improve performance

-- Election indexes
CREATE INDEX IF NOT EXISTS "Election_status_idx" ON "Election"("status");
CREATE INDEX IF NOT EXISTS "Election_startDate_idx" ON "Election"("startDate");
CREATE INDEX IF NOT EXISTS "Election_endDate_idx" ON "Election"("endDate");
CREATE INDEX IF NOT EXISTS "Election_createdById_idx" ON "Election"("createdById");
CREATE INDEX IF NOT EXISTS "Election_status_startDate_idx" ON "Election"("status", "startDate");

-- Candidate indexes
CREATE INDEX IF NOT EXISTS "Candidate_electionId_status_idx" ON "Candidate"("electionId", "status");
CREATE INDEX IF NOT EXISTS "Candidate_status_idx" ON "Candidate"("status");

-- Vote indexes (critical for count performance)
CREATE INDEX IF NOT EXISTS "Vote_electionId_idx" ON "Vote"("electionId");
CREATE INDEX IF NOT EXISTS "Vote_voterId_idx" ON "Vote"("voterId");
CREATE INDEX IF NOT EXISTS "Vote_castAt_idx" ON "Vote"("castAt");
CREATE INDEX IF NOT EXISTS "Vote_electionId_positionId_idx" ON "Vote"("electionId", "positionId");

-- User indexes
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_isVerified_idx" ON "User"("isVerified");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_faculty_idx" ON "User"("faculty");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");
CREATE INDEX IF NOT EXISTS "User_yearOfStudy_idx" ON "User"("yearOfStudy");

-- VotingSession indexes
CREATE INDEX IF NOT EXISTS "VotingSession_electionId_idx" ON "VotingSession"("electionId");
CREATE INDEX IF NOT EXISTS "VotingSession_voterId_idx" ON "VotingSession"("voterId");
CREATE INDEX IF NOT EXISTS "VotingSession_status_idx" ON "VotingSession"("status");

-- Initialize system stats with current counts (this may take a while on first run)
INSERT INTO "SystemStats" ("id", "key", "value", "updatedAt") VALUES
  (gen_random_uuid()::text, 'total_users',
   jsonb_build_object('count', (SELECT COUNT(*) FROM "User"), 'timestamp', NOW()),
   NOW()),
  (gen_random_uuid()::text, 'total_elections',
   jsonb_build_object('count', (SELECT COUNT(*) FROM "Election"), 'timestamp', NOW()),
   NOW()),
  (gen_random_uuid()::text, 'total_candidates',
   jsonb_build_object('count', (SELECT COUNT(*) FROM "Candidate"), 'timestamp', NOW()),
   NOW()),
  (gen_random_uuid()::text, 'total_votes',
   jsonb_build_object('count', (SELECT COUNT(*) FROM "Vote"), 'timestamp', NOW()),
   NOW()),
  (gen_random_uuid()::text, 'active_elections',
   jsonb_build_object('count', (SELECT COUNT(*) FROM "Election" WHERE status = 'ACTIVE'), 'timestamp', NOW()),
   NOW());

-- Add comment
COMMENT ON TABLE "SystemStats" IS 'Cached system statistics for performance optimization';
