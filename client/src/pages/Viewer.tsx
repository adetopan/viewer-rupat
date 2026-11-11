import { useCallback } from "react";
import { fetchRooms } from "../api";
import { usePoll } from "../hooks/usePoll";
import { useViewerFullscreen } from "../hooks/useViewerFullscreen";
import { TvRoomPanel } from "../components/TvRoomPanel";
import { ViewerTicker } from "../components/ViewerTicker";

export function Viewer() {
  useViewerFullscreen();
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
        <div className="tv-list">
          {data.rooms.map((room) => (
            <TvRoomPanel key={room.id} room={room} />
          ))}
        </div>
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
