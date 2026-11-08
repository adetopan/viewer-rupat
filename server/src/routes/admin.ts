import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const adminRouter = Router();

function checkPin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_PIN ?? "1234";
  const pin = req.header("x-admin-pin");
  if (pin !== expected) {
    res.status(401).json({ error: "PIN admin salah" });
    return;
  }
  next();
}

adminRouter.use(checkPin);

adminRouter.get("/bookings", async (req, res) => {
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(new Date().setHours(0, 0, 0, 0));
  const to = req.query.to
    ? new Date(String(req.query.to))
    : new Date(new Date().setDate(new Date().getDate() + 7));

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: from, lte: to } },
    include: { room: true },
    orderBy: { startAt: "asc" },
  });
  res.json(bookings);
});
