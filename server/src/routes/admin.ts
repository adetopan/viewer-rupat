import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAdminAuth,
  signAdminToken,
  verifyPassword,
} from "../lib/auth.js";

export const adminRouter = Router();

adminRouter.post("/login", async (req, res) => {
  const body = z
    .object({
      username: z.string().min(1),
      password: z.string().min(1),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Username dan password wajib diisi" });
    return;
  }

  const user = await prisma.adminUser.findUnique({
    where: { username: body.data.username },
  });
  if (!user || !(await verifyPassword(body.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const token = signAdminToken(user.id, user.username);
  res.json({ token, username: user.username });
});

adminRouter.use(requireAdminAuth);

const roomSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  floor: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `ruang-${Date.now()}`
  );
}

adminRouter.get("/rooms", async (_req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(rooms);
});

adminRouter.post("/rooms", async (req, res) => {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { name, floor, capacity, sortOrder } = parsed.data;
  let slug = parsed.data.slug?.trim() || slugify(name);
  const existing = await prisma.room.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const room = await prisma.room.create({
    data: {
      name,
      slug,
      floor: floor ?? null,
      capacity: capacity ?? null,
      sortOrder: sortOrder ?? 0,
    },
  });
  res.status(201).json(room);
});

adminRouter.delete("/rooms/:id", async (req, res) => {
  try {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Ruang tidak ditemukan" });
  }
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

adminRouter.get("/bookings", async (req, res) => {
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(new Date().setHours(0, 0, 0, 0));
  const to = req.query.to
    ? new Date(String(req.query.to))
    : new Date(new Date().setDate(new Date().getDate() + 14));

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: from, lte: to } },
    include: { room: true },
    orderBy: { startAt: "asc" },
  });
  res.json(bookings);
});

adminRouter.post("/bookings", async (req, res) => {
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

adminRouter.delete("/bookings/:id", async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Jadwal tidak ditemukan" });
  }
});
