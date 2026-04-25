-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "portion" TEXT NOT NULL,
    "isQuick" BOOLEAN NOT NULL DEFAULT false,
    "isLight" BOOLEAN NOT NULL DEFAULT false,
    "isPre" BOOLEAN NOT NULL DEFAULT false,
    "isPost" BOOLEAN NOT NULL DEFAULT false,
    "isIntra" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" INTEGER,
    "fatigue" INTEGER,
    "hunger" INTEGER,
    "stress" INTEGER,
    "trainingType" TEXT,
    "durationMin" INTEGER,
    "intensity" TEXT,
    "timeOfDay" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "breakfast" TEXT,
    "preWorkout" TEXT,
    "intraWorkout" TEXT,
    "postWorkout" TEXT,
    "lunch" TEXT,
    "snack" TEXT,
    "dinner" TEXT,
    "rationale" TEXT,
    "foodReferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "energy" INTEGER,
    "hunger" INTEGER,
    "performance" INTEGER,
    "digestion" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCheckin_userId_idx" ON "DailyCheckin"("userId");

-- CreateIndex
CREATE INDEX "DailyCheckin_date_idx" ON "DailyCheckin"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_userId_date_key" ON "DailyCheckin"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyRecommendation_userId_idx" ON "DailyRecommendation"("userId");

-- CreateIndex
CREATE INDEX "DailyRecommendation_date_idx" ON "DailyRecommendation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecommendation_userId_date_key" ON "DailyRecommendation"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyFeedback_userId_idx" ON "DailyFeedback"("userId");

-- CreateIndex
CREATE INDEX "DailyFeedback_date_idx" ON "DailyFeedback"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyFeedback_userId_date_key" ON "DailyFeedback"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyFeedback" ADD CONSTRAINT "DailyFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
