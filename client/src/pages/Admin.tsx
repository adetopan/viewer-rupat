import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createBooking,
  deleteBooking,
  fetchAdminBookings,
  fetchRooms,
  type AdminBooking,
  type RoomSummary,
} from "../api";
import { usePoll } from "../hooks/usePoll";
import { formatDateLong, formatTime } from "../lib/format";

export function Admin() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterRoom, setFilterRoom] = useState<string>("all");

  const loadRooms = useCallback(() => fetchRooms(), []);
  const { data, refresh: refreshRooms } = usePoll(loadRooms, 60000);
  const rooms: RoomSummary[] = data?.rooms ?? [];

  const loadBookings = useCallback(async () => {
    if (!unlocked || !pin) return;
    setLoadingBookings(true);
    try {
      const list = await fetchAdminBookings(pin);
      setBookings(list);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat jadwal");
    } finally {
      setLoadingBookings(false);
    }
  }, [unlocked, pin]);

  useEffect(() => {
    if (unlocked) loadBookings();
  }, [unlocked, loadBookings]);

  function tryUnlock(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (pin.length < 4) {
      setMessage("Masukkan PIN minimal 4 digit");
      return;
    }
    fetchAdminBookings(pin)
      .then(() => setUnlocked(true))
      .catch(() => setMessage("PIN salah atau server tidak terjangkau"));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const roomId = String(fd.get("roomId"));
    try {
      await createBooking(
        {
          roomId,
          title: String(fd.get("title")),
          organizer: String(fd.get("organizer") || "") || null,
          department: String(fd.get("department") || "") || null,
          description: null,
          startAt: new Date(String(fd.get("startAt"))).toISOString(),
          endAt: new Date(String(fd.get("endAt"))).toISOString(),
        },
        pin
      );
      setMessage("Jadwal berhasil disimpan");
      e.currentTarget.reset();
      refreshRooms();
      await loadBookings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await deleteBooking(id, pin);
      setMessage("Jadwal dihapus");
      refreshRooms();
      await loadBookings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const filtered =
    filterRoom === "all"
      ? bookings
      : bookings.filter((b) => b.roomId === filterRoom);

  if (!unlocked) {
    return (
      <div className="admin-login">
        <form className="admin-form admin-form--login" onSubmit={tryUnlock}>
          <h2>Masuk Dashboard Admin</h2>
          <p>
            Digunakan di komputer admin untuk mengisi jadwal. Tampilan TV hanya
            membaca data (tanpa input).
          </p>
          <label>
            PIN Admin
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
            />
          </label>
          {message && <div className="error-banner">{message}</div>}
          <button type="submit" className="btn-primary">
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {message && (
        <div
          className="toast-banner"
          data-type={message.includes("berhasil") || message.includes("dihapus") ? "ok" : "err"}
        >
          {message}
        </div>
      )}

      <div className="admin-columns">
        <section className="admin-card">
          <h2>Tambah jadwal rapat</h2>
          <form className="admin-form" onSubmit={onSubmit}>
            <label>
              Ruang
              <select name="roomId" required>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Judul rapat / kegiatan
              <input name="title" required placeholder="Contoh: Rapat Koordinasi PPI" />
            </label>
            <label>
              Penyelenggara / pimpinan
              <input name="organizer" placeholder="Nama / jabatan" />
            </label>
            <label>
              Unit / instalasi
              <input name="department" placeholder="Contoh: Keperawatan" />
            </label>
            <div className="admin-form__row">
              <label>
                Mulai
                <input
                  name="startAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalInput(defaultStart)}
                />
              </label>
              <label>
                Selesai
                <input
                  name="endAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalInput(defaultEnd)}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary">
              Simpan ke database
            </button>
          </form>
        </section>

        <section className="admin-card admin-card--wide">
          <div className="admin-list-head">
            <h2>Daftar jadwal</h2>
            <label className="admin-filter">
              Filter ruang
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
          </div>
          {loadingBookings ? (
            <p>Memuat jadwal…</p>
          ) : filtered.length === 0 ? (
            <p className="admin-empty">Belum ada jadwal dalam 14 hari ke depan.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Ruang</th>
                    <th>Kegiatan</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td>{formatDateLong(b.startAt)}</td>
                      <td>
                        {formatTime(b.startAt)}–{formatTime(b.endAt)}
                      </td>
                      <td>{b.room.name}</td>
                      <td>
                        <strong>{b.title}</strong>
                        {(b.organizer || b.department) && (
                          <span className="admin-table-sub">
                            {[b.organizer, b.department].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost btn-ghost--danger"
                          onClick={() => remove(b.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
