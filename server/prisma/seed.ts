import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";
import { ensureFixedRooms } from "../src/lib/ensureFixedRooms.js";

const prisma = new PrismaClient();

async function main() {
  await ensureFixedRooms();

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "Jagakarsa28";
  const passwordHash = await hashPassword(password);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Seed selesai: 4 ruang tetap + admin "${username}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
