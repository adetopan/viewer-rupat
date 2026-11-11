import type { Booking, Room } from "@prisma/client";

const defaultLead =
  "RS Bhayangkara TK I Pusdokkes Polri — Informasi pemakaian ruang rapat diperbarui otomatis";

function formatTime(d: Date) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(now: Date, startAt: Date, endAt: Date) {
  if (now >= startAt && now < endAt) return "Sedang berlangsung";
  if (now < startAt) return "Akan datang";
  return "Selesai";
}

/** Teks untuk running text TV (dari env + jadwal hari ini). */
export function buildViewerTicker(
  now: Date,
  rooms: Room[],
  bookings: Booking[]
): string {
  const custom = process.env.VIEWER_TICKER?.trim();
  const parts: string[] = custom ? [custom] : [defaultLead];

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const today = bookings
    .filter((b) => b.startAt <= dayEnd && b.endAt >= dayStart)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  for (const b of today.slice(0, 10)) {
    const room = rooms.find((r) => r.id === b.roomId);
    const roomName = room?.name ?? "Ruang rapat";
    const status = statusLabel(now, b.startAt, b.endAt);
    parts.push(
      `${roomName}: ${b.title} (${formatTime(b.startAt)}–${formatTime(b.endAt)}) · ${status}`
    );
  }

  parts.push(
    "Penjadwalan rapat melalui TAUD · Hubungi admin untuk perubahan mendadak"
  );

  return parts.join("   ◆   ");
}
