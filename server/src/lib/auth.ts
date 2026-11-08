import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const TOKEN_TTL = "8h";

export function getJwtSecret() {
  return process.env.JWT_SECRET ?? "rupat-ganti-di-production";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(userId: string, username: string) {
  return jwt.sign({ sub: userId, username }, getJwtSecret(), {
    expiresIn: TOKEN_TTL,
  });
}

export type AuthPayload = { sub: string; username: string };

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Silakan login admin" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Sesi habis, login ulang" });
  }
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}
