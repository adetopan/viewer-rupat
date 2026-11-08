import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRoomStatus } from "../lib/roomStatus.js";

export const roomsRouter = Router();

roomsRouter.get("/", async (_req, res) => {
  const now = new Date();
  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: "asc" } });
  const bookings = await prisma.booking.findMany({
    where: { endAt: { gte: now } },
    orderBy: { startAt: "asc" },
  });

  const payload = rooms.map((room) => {
    const roomBookings = bookings.filter((b) => b.roomId === room.id);
    const current =
      roomBookings.find((b) => b.startAt <= now && b.endAt > now) ?? null;
    const next = roomBookings.find((b) => b.startAt > now) ?? null;
    const { status } = getRoomStatus(now, current, next);
    return {
      ...room,
      status,
      currentBooking: current,
      nextBooking: next,
    };
  });

  res.json({ serverTime: now.toISOString(), rooms: payload });
});

roomsRouter.get("/:slug", async (req, res) => {
  const now = new Date();
  const room = await prisma.room.findUnique({
    where: { slug: req.params.slug },
  });
  if (!room) {
    res.status(404).json({ error: "Ruang tidak ditemukan" });
    return;
  }

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const todayBookings = await prisma.booking.findMany({
    where: {
      roomId: room.id,
      startAt: { lte: dayEnd },
      endAt: { gte: dayStart },
    },
    orderBy: { startAt: "asc" },
  });

  const current =
    todayBookings.find((b) => b.startAt <= now && b.endAt > now) ?? null;
  const next =
    todayBookings.find((b) => b.startAt > now) ??
    (await prisma.booking.findFirst({
      where: { roomId: room.id, startAt: { gt: now } },
      orderBy: { startAt: "asc" },
    }));

  const { status } = getRoomStatus(now, current, next);

  res.json({
    serverTime: now.toISOString(),
    room: { ...room, status, currentBooking: current, nextBooking: next },
    scheduleToday: todayBookings,
  });
});
