import { prisma } from "./prisma.js";
import { FIXED_ROOMS } from "./fixedRooms.js";

export async function ensureFixedRooms() {
  for (const room of FIXED_ROOMS) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: {
        name: room.name,
        floor: room.floor,
        sortOrder: room.sortOrder,
      },
      create: {
        slug: room.slug,
        name: room.name,
        floor: room.floor,
        sortOrder: room.sortOrder,
      },
    });
  }
}
