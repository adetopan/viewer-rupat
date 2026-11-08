import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rooms = [
  {
    slug: "ruang-rapat-1",
    name: "Ruang Rapat 1",
    floor: "Lantai 1",
    capacity: 12,
    sortOrder: 1,
  },
  {
    slug: "ruang-rapat-2",
    name: "Ruang Rapat 2",
    floor: "Lantai 1",
    capacity: 12,
    sortOrder: 2,
  },
  {
    slug: "ruang-rapat-lt2",
    name: "Ruang Rapat Lt2",
    floor: "Lantai 2",
    capacity: 16,
    sortOrder: 3,
  },
  {
    slug: "aula-boediharto",
    name: "Aula Boediharto",
    floor: "Lantai 1",
    capacity: 80,
    sortOrder: 4,
  },
];

function addHours(d: Date, h: number) {
  return new Date(d.getTime() + h * 60 * 60 * 1000);
}

async function main() {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: room,
      create: room,
    });
  }

  const allRooms = await prisma.room.findMany();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(8, 0, 0, 0);

  const samples = [
    {
      slug: "ruang-rapat-1",
      title: "Rapat Koordinasi Pelayanan",
      organizer: "Kepala Instalasi",
      department: "Manajemen",
      start: addHours(startOfDay, 2),
      end: addHours(startOfDay, 4),
    },
    {
      slug: "ruang-rapat-2",
      title: "Briefing Perawat",
      organizer: "Kepala Ruang",
      department: "Keperawatan",
      start: addHours(startOfDay, 1),
      end: addHours(startOfDay, 2.5),
    },
    {
      slug: "aula-boediharto",
      title: "Pelatihan K3RS",
      organizer: "Tim Mutu",
      department: "K3",
      start: addHours(startOfDay, 3),
      end: addHours(startOfDay, 6),
    },
  ];

  await prisma.booking.deleteMany();

  for (const s of samples) {
    const room = allRooms.find((r) => r.slug === s.slug);
    if (!room) continue;
    await prisma.booking.create({
      data: {
        roomId: room.id,
        title: s.title,
        organizer: s.organizer,
        department: s.department,
        startAt: s.start,
        endAt: s.end,
      },
    });
  }

  console.log("Seed selesai: 4 ruang + contoh jadwal.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
