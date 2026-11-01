-- DropIndex
DROP INDEX "Person_groupId_loginCode_key";

-- DropIndex
DROP INDEX "Person_loginCode_idx";

-- AlterTable
ALTER TABLE "AdminConfig" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "loginCode",
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AdminConfig_userId_idx" ON "AdminConfig"("userId");

-- CreateIndex
CREATE INDEX "Person_userId_idx" ON "Person"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_groupId_userId_key" ON "Person"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminConfig" ADD CONSTRAINT "AdminConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
