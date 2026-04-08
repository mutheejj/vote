-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "metadata" JSONB;
