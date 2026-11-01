-- AlterTable
ALTER TABLE "AdminConfig" ADD COLUMN     "personId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminConfig_personId_key" ON "AdminConfig"("personId");

-- AddForeignKey
ALTER TABLE "AdminConfig" ADD CONSTRAINT "AdminConfig_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
