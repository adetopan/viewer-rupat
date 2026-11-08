export type RoomStatus = "kosong" | "berlangsung" | "akan_datang";

type BookingSlot = { startAt: Date; endAt: Date };

export function getRoomStatus(
  now: Date,
  current: BookingSlot | null,
  next: BookingSlot | null
): { status: RoomStatus; current: BookingSlot | null; next: BookingSlot | null } {
  if (current && now >= current.startAt && now < current.endAt) {
    return { status: "berlangsung", current, next };
  }
  if (next && now < next.startAt) {
    const minsUntil = (next.startAt.getTime() - now.getTime()) / 60000;
    if (minsUntil <= 30) {
      return { status: "akan_datang", current: null, next };
    }
  }
  return { status: "kosong", current: null, next };
}
