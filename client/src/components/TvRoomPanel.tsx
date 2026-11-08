import type { RoomSummary } from "../api";
import { formatTime, statusLabel } from "../lib/format";

export function TvRoomPanel({ room }: { room: RoomSummary }) {
  const ongoing = room.currentBooking;
  const upcoming = room.nextBooking;

  let activityTitle: string;
  let activityDetail: string;
  let activityLabel: string;

  if (room.status === "berlangsung" && ongoing) {
    activityLabel = "Sedang berlangsung";
    activityTitle = ongoing.title;
    activityDetail = [
      `${formatTime(ongoing.startAt)} – ${formatTime(ongoing.endAt)}`,
      ongoing.organizer,
      ongoing.department,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (room.status === "akan_datang" && upcoming) {
    activityLabel = "Akan dimulai";
    activityTitle = upcoming.title;
    activityDetail = [
      `${formatTime(upcoming.startAt)} – ${formatTime(upcoming.endAt)}`,
      upcoming.organizer,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (upcoming) {
    activityLabel = "Jadwal berikutnya";
    activityTitle = upcoming.title;
    activityDetail = `${formatTime(upcoming.startAt)} – ${formatTime(upcoming.endAt)}`;
  } else {
    activityLabel = "Kegiatan";
    activityTitle = "—";
    activityDetail = "Tidak ada rapat terjadwal hari ini";
  }

  if (room.status === "kosong" && !upcoming) {
    activityTitle = "Tersedia";
    activityDetail = "Ruang tidak digunakan";
    activityLabel = "";
  }

  return (
    <article
      className={`tv-panel tv-panel--${room.status}`}
      aria-label={`${room.name}, ${statusLabel(room.status)}`}
    >
      <header className="tv-panel__head">
        <h2 className="tv-panel__room">{room.name}</h2>
        <span className={`badge badge--${room.status}`}>
          {statusLabel(room.status)}
        </span>
      </header>
      {activityLabel ? (
        <p className="tv-panel__label">{activityLabel}</p>
      ) : null}
      <p className="tv-panel__title">{activityTitle}</p>
      <p className="tv-panel__detail">{activityDetail}</p>
      {room.floor && (
        <p className="tv-panel__meta">
          {room.floor}
          {room.capacity ? ` · ${room.capacity} orang` : ""}
        </p>
      )}
    </article>
  );
}
