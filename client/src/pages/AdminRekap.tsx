import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  fetchAdminRooms,
  fetchBookingRekap,
  type AdminBooking,
  type RoomRecord,
} from "../api";
import { getAdminToken } from "../lib/authSession";
import { formatDateTable, formatTime } from "../lib/format";

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function bookingPhase(
  b: AdminBooking,
  now = new Date()
): "selesai" | "berlangsung" | "akan_datang" {
  const start = new Date(b.startAt);
  const end = new Date(b.endAt);
  if (end <= now) return "selesai";
  if (start <= now && end > now) return "berlangsung";
  return "akan_datang";
}

const phaseLabel = {
  selesai: "Selesai",
  berlangsung: "Berlangsung",
  akan_datang: "Akan datang",
} as const;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat__value">{value}</span>
      <span className="admin-stat__label">{label}</span>
    </div>
  );
}

export function AdminRekap() {
  const authed = !!getAdminToken();
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [fromDate, setFromDate] = useState(() => toDateInput(startOfMonth()));
  const [toDate, setToDate] = useState(() => toDateInput(endOfMonth()));
  const [filterRoom, setFilterRoom] = useState("all");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    fetchAdminRooms()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [authed]);

  const loadRekap = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError(null);
    try {
      const from = new Date(`${fromDate}T00:00:00`);
      const to = new Date(`${toDate}T23:59:59`);
      const data = await fetchBookingRekap({
        from: from.toISOString(),
        to: to.toISOString(),
        roomId: filterRoom === "all" ? undefined : filterRoom,
      });
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap");
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [authed, fromDate, toDate, filterRoom]);

  useEffect(() => {
    loadRekap();
  }, [loadRekap]);

  const stats = useMemo(() => {
    const now = new Date();
    let selesai = 0;
    let berlangsung = 0;
    let akan = 0;
    for (const b of bookings) {
      const p = bookingPhase(b, now);
      if (p === "selesai") selesai++;
      else if (p === "berlangsung") berlangsung++;
      else akan++;
    }
    return { selesai, berlangsung, akan };
  }, [bookings]);

  const byRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      const name = b.room.name;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  if (!authed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-dashboard admin-rekap">
      <div className="admin-hero">
        <div className="admin-hero__text">
          <h2 className="admin-hero__title">Rekap jadwal rapat</h2>
          <p className="admin-hero__sub">
            Tampilan data historis — hanya baca, tanpa ubah jadwal
          </p>
        </div>
        <div className="admin-stats">
          <StatCard label="Total rekap" value={total} />
          <StatCard label="Selesai" value={stats.selesai} />
          <StatCard label="Berlangsung" value={stats.berlangsung} />
          <StatCard label="Akan datang" value={stats.akan} />
        </div>
      </div>

      <section className="admin-card admin-rekap__filters">
        <h2>Filter periode</h2>
        <div className="admin-rekap__filter-grid">
          <label>
            Dari tanggal
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            Sampai tanggal
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <label>
            Ruang
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
            >
              <option value="all">Semua ruang</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-primary admin-rekap__apply"
            onClick={loadRekap}
            disabled={loading}
          >
            {loading ? "Memuat…" : "Tampilkan rekap"}
          </button>
        </div>
      </section>

      {error && (
        <div className="toast-banner" data-type="err">
          {error}
        </div>
      )}

      {byRoom.length > 0 && (
        <section className="admin-card admin-rekap__summary">
          <h2>Ringkasan per ruang</h2>
          <ul className="admin-rekap__room-stats">
            {byRoom.map(([name, count]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{count} rapat</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin-card admin-card--wide">
        <h2>Data rekap rapat</h2>
        {loading ? (
          <p className="admin-rekap__loading">Memuat data rekap…</p>
        ) : bookings.length === 0 ? (
          <div className="admin-empty-state">
            <p className="admin-empty-state__title">Tidak ada data</p>
            <p className="admin-empty-state__sub">
              Ubah rentang tanggal atau filter ruang lalu tampilkan rekap.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap admin-rekap__table-wrap">
            <table className="admin-table admin-rekap__table">
              <thead>
                <tr>
                  <th className="admin-table__col-date">Tanggal</th>
                  <th className="admin-table__col-time">Waktu</th>
                  <th className="admin-table__col-room">Ruang</th>
                  <th className="admin-table__col-title">Informasi kegiatan</th>
                  <th className="admin-rekap__col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const dateParts = formatDateTable(b.startAt);
                  const phase = bookingPhase(b);
                  return (
                    <tr key={b.id}>
                      <td className="admin-table__date">
                        <span className="admin-table__date-week">
                          {dateParts.weekday}
                        </span>
                        <span className="admin-table__date-rest">
                          {dateParts.rest}
                        </span>
                      </td>
                      <td className="admin-table__time">
                        {formatTime(b.startAt)}–{formatTime(b.endAt)}
                      </td>
                      <td className="admin-table__room">{b.room.name}</td>
                      <td className="admin-table__info">
                        <strong>{b.title}</strong>
                        {(b.organizer || b.department) && (
                          <span className="admin-table-sub">
                            {[b.organizer, b.department].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="rekap-badge" data-phase={phase}>
                          {phaseLabel[phase]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
