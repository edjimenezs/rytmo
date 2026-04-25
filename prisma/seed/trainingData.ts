import { PrismaClient, ActivityType, Prisma } from "@prisma/client";
import { subDays, addHours } from "date-fns";

const prisma = new PrismaClient();
type TrainingActivityCreateData = Prisma.TrainingActivityUncheckedCreateInput;

const activityTypes: ActivityType[] = [
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "WALKING",
  "WEIGHTLIFTING",
  "YOGA",
];

// Helper function to generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper function to generate random integer in range
function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max));
}

export async function seedTrainingData(userId: string) {
  console.log("Seeding training data for user:", userId);

  const activities: TrainingActivityCreateData[] = [];

  // Generate activities for the last 90 days
  for (let i = 0; i < 90; i++) {
    const date = subDays(new Date(), i);

    // 70% chance of having an activity on any given day
    if (Math.random() > 0.3) {
      // 30% chance of having 2 activities in a day
      const numActivities = Math.random() > 0.7 ? 2 : 1;

      for (let j = 0; j < numActivities; j++) {
        const activityType = activityTypes[randomIntInRange(0, activityTypes.length)];
        const startTime = addHours(date, randomIntInRange(6, 20)); // Between 6 AM and 8 PM

        let activity: TrainingActivityCreateData = {
          userId,
          type: activityType,
          source: "MANUAL",
          startDate: startTime,
          name: "Training Session",
        };

        // Generate metrics based on activity type
        switch (activityType) {
          case "RUNNING":
            const runningDistance = randomInRange(3000, 15000); // 3-15km
            const runningDuration = randomIntInRange(1200, 5400); // 20-90 minutes
            activity = {
              ...activity,
              name: "Morning Run",
              distance: runningDistance,
              duration: runningDuration,
              elevation: randomInRange(50, 300),
              calories: randomIntInRange(200, 800),
              averageHeartRate: randomIntInRange(140, 170),
              maxHeartRate: randomIntInRange(170, 190),
              averagePace: runningDuration / 60 / (runningDistance / 1000), // min/km
              endDate: addHours(startTime, runningDuration / 3600),
            };
            break;

          case "CYCLING":
            const cyclingDistance = randomInRange(15000, 60000); // 15-60km
            const cyclingDuration = randomIntInRange(2400, 10800); // 40-180 minutes
            activity = {
              ...activity,
              name: "Bike Ride",
              distance: cyclingDistance,
              duration: cyclingDuration,
              elevation: randomInRange(100, 800),
              calories: randomIntInRange(400, 1200),
              averageHeartRate: randomIntInRange(130, 160),
              maxHeartRate: randomIntInRange(160, 180),
              averagePace: cyclingDuration / 60 / (cyclingDistance / 1000),
              endDate: addHours(startTime, cyclingDuration / 3600),
            };
            break;

          case "SWIMMING":
            const swimmingDistance = randomInRange(1000, 4000); // 1-4km
            const swimmingDuration = randomIntInRange(1800, 5400); // 30-90 minutes
            activity = {
              ...activity,
              name: "Pool Swim",
              distance: swimmingDistance,
              duration: swimmingDuration,
              calories: randomIntInRange(300, 700),
              averageHeartRate: randomIntInRange(120, 150),
              maxHeartRate: randomIntInRange(150, 170),
              endDate: addHours(startTime, swimmingDuration / 3600),
            };
            break;

          case "WALKING":
            const walkingDistance = randomInRange(2000, 8000); // 2-8km
            const walkingDuration = randomIntInRange(1800, 7200); // 30-120 minutes
            activity = {
              ...activity,
              name: "Walk",
              distance: walkingDistance,
              duration: walkingDuration,
              elevation: randomInRange(20, 200),
              calories: randomIntInRange(150, 400),
              averageHeartRate: randomIntInRange(100, 130),
              maxHeartRate: randomIntInRange(130, 150),
              averagePace: walkingDuration / 60 / (walkingDistance / 1000),
              endDate: addHours(startTime, walkingDuration / 3600),
            };
            break;

          case "WEIGHTLIFTING":
            const weightDuration = randomIntInRange(2400, 5400); // 40-90 minutes
            activity = {
              ...activity,
              name: "Strength Training",
              duration: weightDuration,
              calories: randomIntInRange(200, 500),
              averageHeartRate: randomIntInRange(110, 140),
              maxHeartRate: randomIntInRange(140, 160),
              endDate: addHours(startTime, weightDuration / 3600),
            };
            break;

          case "YOGA":
            const yogaDuration = randomIntInRange(2400, 5400); // 40-90 minutes
            activity = {
              ...activity,
              name: "Yoga Session",
              duration: yogaDuration,
              calories: randomIntInRange(100, 300),
              averageHeartRate: randomIntInRange(80, 110),
              maxHeartRate: randomIntInRange(110, 130),
              endDate: addHours(startTime, yogaDuration / 3600),
            };
            break;
        }

        activities.push(activity);
      }
    }
  }

  // Create all activities
  console.log(`Creating ${activities.length} training activities...`);

  for (const activity of activities) {
    await prisma.trainingActivity.create({
      data: activity,
    });
  }

  console.log("Training data seeded successfully!");
}

// Run seed if this file is executed directly
if (require.main === module) {
  const userId = process.argv[2];

  if (!userId) {
    console.error("Please provide a userId as an argument");
    console.error("Usage: ts-node trainingData.ts <userId>");
    process.exit(1);
  }

  seedTrainingData(userId)
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding data:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
