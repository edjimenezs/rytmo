-- AlterTable
ALTER TABLE "DailyFeedback" ADD COLUMN     "recommendationId" TEXT;

-- AlterTable
ALTER TABLE "DailyRecommendation" ADD COLUMN     "aiHeadline" TEXT,
ADD COLUMN     "aiMomentTexts" JSONB;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "defaultTrainingTime" TEXT;

-- AddForeignKey
ALTER TABLE "DailyFeedback" ADD CONSTRAINT "DailyFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "DailyRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
