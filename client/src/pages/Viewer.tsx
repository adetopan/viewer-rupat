import { useCallback } from "react";
import { fetchRooms } from "../api";
import { usePoll } from "../hooks/usePoll";
import { TvRoomPanel } from "../components/TvRoomPanel";

export function Viewer() {
  const load = useCallback(() => fetchRooms(), []);
  const { data, error, loading } = usePoll(load, 8000);

  return (
    <div className="viewer-screen">
      {error && <div className="error-banner">{error}</div>}
      {loading && !data && (
        <p className="viewer-loading">Memuat status ruang rapat…</p>
      )}
      {data && data.rooms.length === 0 && (
        <p className="viewer-loading">Memuat daftar ruang…</p>
      )}
      {data && data.rooms.length > 0 && (
        <div className="tv-grid">
          {data.rooms.map((room) => (
            <TvRoomPanel key={room.id} room={room} />
          ))}
        </div>
      )}
      <footer className="viewer-footer">
        SIMRS RS POLRI 2026
      </footer>
    </div>
  );
}
