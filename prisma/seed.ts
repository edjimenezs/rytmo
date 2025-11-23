import { PrismaClient } from "@prisma/client";
import { seedTrainingData } from "./seed/trainingData";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // You can add the userId of the athlete you want to seed data for
  // You can find user IDs in your database or create a new test user first

  // Example: Uncomment and replace with actual userId
  // const userId = "your-user-id-here";
  // await seedTrainingData(userId);

  console.log("To seed training data, run:");
  console.log("npx ts-node prisma/seed/trainingData.ts <userId>");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
