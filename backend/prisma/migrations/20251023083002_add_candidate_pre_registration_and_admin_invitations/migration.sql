-- CreateEnum
CREATE TYPE "PreRegStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REGISTERED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CandidatePreRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "phone" TEXT,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL,
    "intendedPosition" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PreRegStatus" NOT NULL DEFAULT 'PENDING',
    "approvalToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatePreRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitationToken" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedByName" TEXT,
    "usedByStudentId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePreRegistration_approvalToken_key" ON "CandidatePreRegistration"("approvalToken");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_email_idx" ON "CandidatePreRegistration"("email");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_studentId_idx" ON "CandidatePreRegistration"("studentId");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_status_idx" ON "CandidatePreRegistration"("status");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_approvalToken_idx" ON "CandidatePreRegistration"("approvalToken");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_createdAt_idx" ON "CandidatePreRegistration"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_invitationToken_key" ON "AdminInvitation"("invitationToken");

-- CreateIndex
CREATE INDEX "AdminInvitation_invitationToken_idx" ON "AdminInvitation"("invitationToken");

-- CreateIndex
CREATE INDEX "AdminInvitation_email_idx" ON "AdminInvitation"("email");

-- CreateIndex
CREATE INDEX "AdminInvitation_used_idx" ON "AdminInvitation"("used");

-- CreateIndex
CREATE INDEX "AdminInvitation_expiresAt_idx" ON "AdminInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "CandidatePreRegistration" ADD CONSTRAINT "CandidatePreRegistration_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
