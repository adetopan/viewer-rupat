import type { AgendaItem, Booking, RoomSummary } from "../api";

function bookingStatus(
  now: Date,
  startAt: string,
  endAt: string
): AgendaItem["status"] {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (now >= end) return "selesai";
  if (now >= start) return "berlangsung";
  return "akan_datang";
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Bangun agenda hari ini dari current/next booking ruang (fallback jika API lama). */
export function agendaFromRooms(
  rooms: RoomSummary[],
  serverTime: string
): AgendaItem[] {
  const now = new Date(serverTime);
  const byId = new Map<string, AgendaItem>();

  const push = (room: RoomSummary, b: Booking | null) => {
    if (!b) return;
    const start = new Date(b.startAt);
    const end = new Date(b.endAt);
    // Tampilkan jika bentang waktu menyentuh hari lokal server/browser
    if (!isSameLocalDay(start, now) && !isSameLocalDay(end, now)) {
      if (end < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return;
      if (start > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999))
        return;
    }
    byId.set(b.id, {
      id: b.id,
      title: b.title,
      organizer: b.organizer,
      department: b.department,
      startAt: b.startAt,
      endAt: b.endAt,
      roomName: room.name,
      roomFloor: room.floor,
      status: bookingStatus(now, b.startAt, b.endAt),
    });
  };

  for (const room of rooms) {
    push(room, room.currentBooking);
    push(room, room.nextBooking);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}

export function resolveTodayAgenda(
  todayAgenda: AgendaItem[] | undefined,
  rooms: RoomSummary[],
  serverTime: string
): AgendaItem[] {
  if (todayAgenda && todayAgenda.length > 0) return todayAgenda;
  // API lama tanpa todayAgenda, atau kosong tapi ada booking di ruang
  const fallback = agendaFromRooms(rooms, serverTime);
  if (fallback.length > 0) return fallback;
  return todayAgenda ?? [];
}
