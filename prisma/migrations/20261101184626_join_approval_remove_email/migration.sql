-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "Person_email_idx";

-- DropIndex
DROP INDEX "Person_groupId_email_key";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "email",
ADD COLUMN     "status" "ParticipationStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "Person_groupId_status_idx" ON "Person"("groupId", "status");
