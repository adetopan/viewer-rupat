import { Outlet } from "react-router-dom";
import { useClock } from "../hooks/useClock";
import { formatDateLong } from "../lib/format";

export function ViewerLayout() {
  const now = useClock();

  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="layout layout--viewer">
      <header className="header header--viewer">
        <div className="header-brand">
          <img src="/logo.png" alt="Kedokteran dan Kesehatan Polri" />
          <div className="header-titles">
            <h1>RS BHAYANGKARA TK I PUSDOKKES POLRI</h1>
            {/* <p>Status Ruang Rapat</p> */}
          </div>
        </div>
        <div className="header-clock" aria-live="polite">
          <div className="time">{timeStr}</div>
          <div className="date">{formatDateLong(now.toISOString())}</div>
        </div>
      </header>
      <main className="main main--viewer">
        <Outlet />
      </main>
    </div>
  );
}
