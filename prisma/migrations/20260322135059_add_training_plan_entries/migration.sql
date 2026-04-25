/*
  Warnings:

  - A unique constraint covering the columns `[userId,externalId,source]` on the table `TrainingActivity` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ActivitySource" ADD VALUE 'GARMIN';

-- CreateTable
CREATE TABLE "TrainingPlanEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,
    "tss" DOUBLE PRECISION,
    "notes" TEXT,
    "matchedActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPeaksIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPeaksIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarminIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GarminIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingPlanEntry_userId_idx" ON "TrainingPlanEntry"("userId");

-- CreateIndex
CREATE INDEX "TrainingPlanEntry_date_idx" ON "TrainingPlanEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlanEntry_userId_date_sessionType_key" ON "TrainingPlanEntry"("userId", "date", "sessionType");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPeaksIntegration_userId_key" ON "TrainingPeaksIntegration"("userId");

-- CreateIndex
CREATE INDEX "TrainingPeaksIntegration_userId_idx" ON "TrainingPeaksIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GarminIntegration_userId_key" ON "GarminIntegration"("userId");

-- CreateIndex
CREATE INDEX "GarminIntegration_userId_idx" ON "GarminIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingActivity_userId_externalId_source_key" ON "TrainingActivity"("userId", "externalId", "source");

-- AddForeignKey
ALTER TABLE "TrainingPlanEntry" ADD CONSTRAINT "TrainingPlanEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlanEntry" ADD CONSTRAINT "TrainingPlanEntry_matchedActivityId_fkey" FOREIGN KEY ("matchedActivityId") REFERENCES "TrainingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPeaksIntegration" ADD CONSTRAINT "TrainingPeaksIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarminIntegration" ADD CONSTRAINT "GarminIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
