import { useCallback, useMemo } from "react";
import { fetchRooms } from "../api";
import { usePoll } from "../hooks/usePoll";
import { useViewerFullscreen } from "../hooks/useViewerFullscreen";
import { AgendaRow } from "../components/TvRoomPanel";
import { ViewerTicker } from "../components/ViewerTicker";
import { resolveTodayAgenda } from "../lib/agenda";

export function Viewer() {
  useViewerFullscreen();
  const load = useCallback(() => fetchRooms(), []);
  const { data, error, loading } = usePoll(load, 8000);

  const agenda = useMemo(() => {
    if (!data) return [];
    return resolveTodayAgenda(data.todayAgenda, data.rooms, data.serverTime);
  }, [data]);

  const live = agenda.filter((a) => a.status === "berlangsung").length;

  return (
    <div className="viewer-screen">
      {error && <div className="error-banner">{error}</div>}
      {loading && !data && (
        <p className="viewer-loading">Memuat agenda rapat…</p>
      )}
      {data && (
        <section className="agenda-board" aria-label="Rapat hari ini">
          <header className="agenda-board__head">
            <div className="agenda-board__titlewrap">
              <span className="agenda-board__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="currentColor"
                    d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10ZM6 6H4v2h16V6H6Z"
                  />
                </svg>
              </span>
              <div>
                <h2>Rapat Hari Ini</h2>
                <p className="agenda-board__sub">Jadwal seluruh ruang rapat</p>
              </div>
            </div>
            <div className="agenda-board__chips">
              {live > 0 && (
                <span className="chip chip--live">
                  <span className="pulse" />
                  {live} sedang berlangsung
                </span>
              )}
              <span className="chip">{agenda.length} agenda</span>
            </div>
          </header>
          <div className="agenda-board__list">
            {agenda.length === 0 ? (
              <div className="agenda-board__empty">
                <p>Tidak ada rapat terjadwal hari ini</p>
                <span>Ruang siap digunakan</span>
              </div>
            ) : (
              agenda.map((item, i) => (
                <AgendaRow key={item.id} item={item} index={i} />
              ))
            )}
          </div>
        </section>
      )}
      <ViewerTicker
        text={
          data?.ticker ??
          "RS Bhayangkara TK I Pusdokkes Polri — Memuat informasi ruang rapat…"
        }
      />
    </div>
  );
}
