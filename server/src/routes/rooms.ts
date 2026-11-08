import { Router, type Request, type Response } from "express";
import { z } from "zod";
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

const bookingSchema = z.object({
  roomId: z.string(),
  title: z.string().min(1),
  organizer: z.string().optional(),
  department: z.string().optional(),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

function requireAdminPin(req: Request, res: Response) {
  const expected = process.env.ADMIN_PIN ?? "1234";
  const pin = req.header("x-admin-pin");
  if (pin !== expected) {
    res.status(401).json({ error: "PIN admin salah" });
    return false;
  }
  return true;
}

roomsRouter.post("/bookings", async (req, res) => {
  if (!requireAdminPin(req, res)) return;
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { startAt, endAt, ...rest } = parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (end <= start) {
    res.status(400).json({ error: "Waktu selesai harus setelah mulai" });
    return;
  }

  const overlap = await prisma.booking.findFirst({
    where: {
      roomId: rest.roomId,
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  if (overlap) {
    res.status(409).json({ error: "Jadwal bentrok dengan pemakaian lain" });
    return;
  }

  const booking = await prisma.booking.create({
    data: { ...rest, startAt: start, endAt: end },
  });
  res.status(201).json(booking);
});

roomsRouter.delete("/bookings/:id", async (req, res) => {
  if (!requireAdminPin(req, res)) return;
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Jadwal tidak ditemukan" });
  }
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
