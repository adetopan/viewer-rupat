import { authHeaders } from "./lib/authSession";
import { messageFromApiError } from "./lib/apiError";

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
  ticker?: string;
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
  if (!res.ok) throw new Error(messageFromApiError(body, "Login gagal"));
  return body;
}

export async function fetchAdminRooms(): Promise<RoomRecord[]> {
  const res = await fetch(`${base}/api/admin/rooms`, {
    headers: { ...authHeaders() },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal memuat ruang"));
  return body;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${base}/api/admin/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal mengubah password"));
}

export type CreateBookingInput = {
  roomId: string;
  title: string;
  organizer?: string | null;
  department?: string | null;
  description?: string | null;
  startAt: string;
  endAt: string;
};

export async function createBooking(data: CreateBookingInput): Promise<Booking> {
  const res = await fetch(`${base}/api/admin/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal menyimpan"));
  return body;
}

export async function updateBooking(
  id: string,
  data: CreateBookingInput
): Promise<AdminBooking> {
  const res = await fetch(`${base}/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal menyimpan perubahan"));
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

export interface BookingRekapResponse {
  from: string;
  to: string;
  total: number;
  bookings: AdminBooking[];
}

export async function fetchBookingRekap(params: {
  from: string;
  to: string;
  roomId?: string;
}): Promise<BookingRekapResponse> {
  const q = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.roomId) q.set("roomId", params.roomId);
  const res = await fetch(`${base}/api/admin/bookings/rekap?${q}`, {
    headers: { ...authHeaders() },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal memuat rekap"));
  return body;
}

export async function fetchAdminBookings(
  daysAhead = 14
): Promise<AdminBooking[]> {
  const to = new Date();
  to.setDate(to.getDate() + daysAhead);
  const q = new URLSearchParams({
    to: to.toISOString(),
  });
  const res = await fetch(`${base}/api/admin/bookings?${q}`, {
    headers: { ...authHeaders() },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(messageFromApiError(body, "Gagal memuat jadwal"));
  return body;
}
