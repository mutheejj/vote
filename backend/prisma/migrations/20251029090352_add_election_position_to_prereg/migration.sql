-- AlterTable
ALTER TABLE "CandidatePreRegistration" ADD COLUMN     "electionId" TEXT,
ADD COLUMN     "positionId" TEXT;

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_electionId_idx" ON "CandidatePreRegistration"("electionId");

-- CreateIndex
CREATE INDEX "CandidatePreRegistration_positionId_idx" ON "CandidatePreRegistration"("positionId");

-- AddForeignKey
ALTER TABLE "CandidatePreRegistration" ADD CONSTRAINT "CandidatePreRegistration_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePreRegistration" ADD CONSTRAINT "CandidatePreRegistration_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
