import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding founder profile...");

  const founder = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!founder) {
    console.log("No user found. Create an account first, then re-run seed.");
    return;
  }

  const profile = await prisma.profile.upsert({
    where: { userId: founder.id },
    update: {
      weight: 66,
      ftp: 280,
      timezone: "America/Santiago",
      location: "Santiago, Chile",
      sportType: "Triathlon",
      experienceLevel: "Advanced",
    },
    create: {
      userId: founder.id,
      weight: 66,
      ftp: 280,
      timezone: "America/Santiago",
      location: "Santiago, Chile",
      sportType: "Triathlon",
      experienceLevel: "Advanced",
    },
  });

  console.log(`Profile seeded for ${founder.email}: weight=${profile.weight}kg, ftp=${profile.ftp}W, tz=${profile.timezone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
