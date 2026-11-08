import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
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

adminRouter.get("/rooms", async (_req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(rooms);
});

adminRouter.post("/change-password", async (req, res) => {
  const parsed = z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }

  const username = req.admin?.username;
  if (!username) {
    res.status(401).json({ error: "Sesi tidak valid" });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Password lama salah" });
    return;
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  res.json({ ok: true, message: "Password berhasil diubah" });
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
