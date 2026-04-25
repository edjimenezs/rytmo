-- AlterTable
ALTER TABLE "DailyRecommendation" ADD COLUMN     "acwr" DOUBLE PRECISION,
ADD COLUMN     "atl" DOUBLE PRECISION,
ADD COLUMN     "ctl" DOUBLE PRECISION,
ADD COLUMN     "dayType" TEXT,
ADD COLUMN     "dinnerFoods" JSONB,
ADD COLUMN     "focus" TEXT,
ADD COLUMN     "intraWorkoutFoods" JSONB,
ADD COLUMN     "planEntryId" TEXT,
ADD COLUMN     "postWorkoutFoods" JSONB,
ADD COLUMN     "preWorkoutFoods" JSONB,
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "trainingActivityId" TEXT;

-- AlterTable
ALTER TABLE "TrainingPlanEntry" ADD COLUMN     "dayType" TEXT NOT NULL DEFAULT 'rest',
ADD COLUMN     "focus" TEXT,
ADD COLUMN     "requiresIntraFuel" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_planEntryId_fkey" FOREIGN KEY ("planEntryId") REFERENCES "TrainingPlanEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_trainingActivityId_fkey" FOREIGN KEY ("trainingActivityId") REFERENCES "TrainingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
