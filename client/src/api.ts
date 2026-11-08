import { authHeaders } from "./lib/authSession";

export type RoomStatus = "kosong" | "berlangsung" | "akan_datang";

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  organizer: string | null;
  department: string | null;
  description: string | null;
  startAt: string;
  endAt: string;
}

export interface RoomSummary {
  id: string;
  slug: string;
  name: string;
  floor: string | null;
  capacity: number | null;
  status: RoomStatus;
  currentBooking: Booking | null;
  nextBooking: Booking | null;
}

export interface RoomRecord {
  id: string;
  slug: string;
  name: string;
  floor: string | null;
  capacity: number | null;
  sortOrder: number;
}

const base = "";

export async function fetchRooms(): Promise<{
  serverTime: string;
  rooms: RoomSummary[];
}> {
  const res = await fetch(`${base}/api/rooms`);
  if (!res.ok) throw new Error("Gagal memuat ruang");
  return res.json();
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ token: string; username: string }> {
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Login gagal");
  return body;
}

export async function fetchAdminRooms(): Promise<RoomRecord[]> {
  const res = await fetch(`${base}/api/admin/rooms`, {
    headers: { ...authHeaders() },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal memuat ruang");
  return body;
}

export async function createRoom(data: {
  name: string;
  floor?: string;
  capacity?: number;
  sortOrder?: number;
}): Promise<RoomRecord> {
  const res = await fetch(`${base}/api/admin/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan ruang");
  return body;
}

export async function deleteRoom(id: string) {
  const res = await fetch(`${base}/api/admin/rooms/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Gagal menghapus ruang");
}

export async function createBooking(
  data: Omit<Booking, "id">
): Promise<Booking> {
  const res = await fetch(`${base}/api/admin/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan");
  return body;
}

export async function deleteBooking(id: string) {
  const res = await fetch(`${base}/api/admin/bookings/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Gagal menghapus");
}

export interface AdminBooking extends Booking {
  room: { id: string; name: string; slug: string };
}

export async function fetchAdminBookings(
  daysAhead = 14
): Promise<AdminBooking[]> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);
  const q = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`${base}/api/admin/bookings?${q}`, {
    headers: { ...authHeaders() },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal memuat jadwal");
  return body;
}
