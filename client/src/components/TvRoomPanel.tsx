import type { AgendaItem } from "../api";
import { formatTime } from "../lib/format";

const weekdayShort: Record<number, string> = {
  0: "Min",
  1: "Sen",
  2: "Sel",
  3: "Rab",
  4: "Kam",
  5: "Jum",
  6: "Sab",
};

const statusText: Record<AgendaItem["status"], string> = {
  berlangsung: "Live",
  akan_datang: "Akan datang",
  selesai: "Selesai",
};

export function AgendaRow({ item, index }: { item: AgendaItem; index: number }) {
  const day = weekdayShort[new Date(item.startAt).getDay()] ?? "";

  return (
    <article
      className={`agenda-row agenda-row--${item.status}`}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`${item.title} di ${item.roomName}`}
    >
      <div className="agenda-row__timechip">
        <span className="agenda-row__clock">
          {formatTime(item.startAt)}
          <span className="agenda-row__sep">–</span>
          {formatTime(item.endAt)}
        </span>
        <span className="agenda-row__day">{day}</span>
      </div>
      <div className="agenda-row__body">
        <p className="agenda-row__title">{item.title}</p>
        <p className="agenda-row__place">
          <svg viewBox="0 0 24 24" className="agenda-row__pin" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
            />
          </svg>
          <span>
            {item.roomName}
            {item.roomFloor ? ` · ${item.roomFloor}` : ""}
          </span>
          {item.organizer ? <span className="agenda-row__host">{item.organizer}</span> : null}
        </p>
      </div>
      <span className={`agenda-row__badge agenda-row__badge--${item.status}`}>
        {item.status === "berlangsung" ? <span className="pulse" /> : null}
        {statusText[item.status]}
      </span>
    </article>
  );
}
