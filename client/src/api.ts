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

const base = "";

export async function fetchRooms(): Promise<{
  serverTime: string;
  rooms: RoomSummary[];
}> {
  const res = await fetch(`${base}/api/rooms`);
  if (!res.ok) throw new Error("Gagal memuat ruang");
  return res.json();
}

export async function fetchRoom(slug: string) {
  const res = await fetch(`${base}/api/rooms/${slug}`);
  if (!res.ok) throw new Error("Ruang tidak ditemukan");
  return res.json() as Promise<{
    serverTime: string;
    room: RoomSummary;
    scheduleToday: Booking[];
  }>;
}

export async function createBooking(
  data: Omit<Booking, "id">,
  pin: string
): Promise<Booking> {
  const res = await fetch(`${base}/api/rooms/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": pin,
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan");
  return body;
}

export async function deleteBooking(id: string, pin: string) {
  const res = await fetch(`${base}/api/rooms/bookings/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  if (!res.ok) throw new Error("Gagal menghapus");
}

export interface AdminBooking extends Booking {
  room: { id: string; name: string; slug: string };
}

export async function fetchAdminBookings(
  pin: string,
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
    headers: { "x-admin-pin": pin },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Gagal memuat jadwal");
  return body;
}
