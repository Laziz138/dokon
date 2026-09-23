import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const seller1Password = await bcrypt.hash("seller123", 10);
  const seller2Password = await bcrypt.hash("seller456", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      username: "admin",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sotuvchi 1",
      username: "seller1",
      password: seller1Password,
      role: Role.SELLER,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sotuvchi 2",
      username: "seller2",
      password: seller2Password,
      role: Role.SELLER,
    },
  });

  console.log("Admin va 2 ta sotuvchi yaratildi!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });