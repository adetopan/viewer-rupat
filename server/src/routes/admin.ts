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

function zodFirstError(error: z.ZodError): string {
  const flat = error.flatten();
  const fromForm = flat.formErrors[0];
  if (fromForm) return fromForm;
  for (const [, msgs] of Object.entries(flat.fieldErrors)) {
    if (msgs?.[0]) return msgs[0];
  }
  return "Data jadwal tidak valid. Periksa ruang, judul, dan waktu.";
}

const bookingSchema = z.object({
  roomId: z.string().min(1, "Pilih ruang"),
  title: z.string().min(1, "Judul rapat wajib diisi"),
  organizer: z.string().nullish(),
  department: z.string().nullish(),
  description: z.string().nullish(),
  startAt: z.string().datetime({ message: "Waktu mulai tidak valid" }),
  endAt: z.string().datetime({ message: "Waktu selesai tidak valid" }),
});

adminRouter.get("/bookings/rekap", async (req, res) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const from = req.query.from
    ? new Date(String(req.query.from))
    : defaultFrom;
  const to = req.query.to ? new Date(String(req.query.to)) : defaultTo;
  const roomId = req.query.roomId ? String(req.query.roomId) : undefined;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ error: "Rentang tanggal tidak valid" });
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      startAt: { gte: from, lte: to },
      ...(roomId ? { roomId } : {}),
    },
    include: { room: true },
    orderBy: { startAt: "desc" },
  });

  res.json({
    from: from.toISOString(),
    to: to.toISOString(),
    total: bookings.length,
    bookings,
  });
});

adminRouter.get("/bookings", async (req, res) => {
  const now = new Date();
  const to = req.query.to
    ? new Date(String(req.query.to))
    : new Date(new Date().setDate(new Date().getDate() + 14));

  const bookings = await prisma.booking.findMany({
    where: {
      /** Sembunyikan rapat yang sudah selesai (waktu selesai lewat). */
      endAt: { gt: now },
      startAt: { lte: to },
    },
    include: { room: true },
    orderBy: { startAt: "asc" },
  });
  res.json(bookings);
});

async function assertNoOverlap(
  roomId: string,
  start: Date,
  end: Date,
  exceptId?: string
) {
  const overlap = await prisma.booking.findFirst({
    where: {
      roomId,
      ...(exceptId ? { id: { not: exceptId } } : {}),
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  return overlap;
}

function parseBookingPayload(body: unknown) {
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return { error: zodFirstError(parsed.error) as string };
  }
  const { startAt, endAt, organizer, department, description, ...rest } =
    parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (end <= start) {
    return { error: "Waktu selesai harus setelah mulai" };
  }
  return { rest, organizer, department, description, start, end };
}

adminRouter.post("/bookings", async (req, res) => {
  const payload = parseBookingPayload(req.body);
  if ("error" in payload) {
    res.status(400).json({ error: payload.error });
    return;
  }
  const { rest, organizer, department, description, start, end } = payload;

  if (await assertNoOverlap(rest.roomId, start, end)) {
    res.status(409).json({ error: "Jadwal bentrok dengan pemakaian lain" });
    return;
  }

  const booking = await prisma.booking.create({
    data: {
      ...rest,
      organizer: organizer ?? null,
      department: department ?? null,
      description: description ?? null,
      startAt: start,
      endAt: end,
    },
  });
  res.status(201).json(booking);
});

adminRouter.patch("/bookings/:id", async (req, res) => {
  const existing = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Jadwal tidak ditemukan" });
    return;
  }

  const payload = parseBookingPayload(req.body);
  if ("error" in payload) {
    res.status(400).json({ error: payload.error });
    return;
  }
  const { rest, organizer, department, description, start, end } = payload;

  if (await assertNoOverlap(rest.roomId, start, end, req.params.id)) {
    res.status(409).json({ error: "Jadwal bentrok dengan pemakaian lain" });
    return;
  }

  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      organizer: organizer ?? null,
      department: department ?? null,
      description: description ?? null,
      startAt: start,
      endAt: end,
    },
    include: { room: true },
  });
  res.json(booking);
});

adminRouter.delete("/bookings/:id", async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Jadwal tidak ditemukan" });
  }
});
