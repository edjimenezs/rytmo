-- AlterTable
ALTER TABLE "MedicalDocument" ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LabValue" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "status" TEXT,
    "testDate" TIMESTAMP(3),
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabValue_documentId_idx" ON "LabValue"("documentId");

-- CreateIndex
CREATE INDEX "LabValue_userId_idx" ON "LabValue"("userId");

-- CreateIndex
CREATE INDEX "LabValue_testName_idx" ON "LabValue"("testName");

-- CreateIndex
CREATE INDEX "LabValue_testDate_idx" ON "LabValue"("testDate");

-- CreateIndex
CREATE INDEX "MedicalDocument_processed_idx" ON "MedicalDocument"("processed");

-- AddForeignKey
ALTER TABLE "LabValue" ADD CONSTRAINT "LabValue_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MedicalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
