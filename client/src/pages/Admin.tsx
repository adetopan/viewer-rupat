import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createBooking,
  createRoom,
  deleteBooking,
  deleteRoom,
  fetchAdminBookings,
  fetchAdminRooms,
  loginAdmin,
  type AdminBooking,
  type RoomRecord,
} from "../api";
import {
  clearAdminSession,
  getAdminToken,
  getAdminUsername,
  setAdminSession,
} from "../lib/authSession";
import { formatDateLong, formatTime } from "../lib/format";

export function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(() => !!getAdminToken());
  const [adminName, setAdminName] = useState(() => getAdminUsername() ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterRoom, setFilterRoom] = useState<string>("all");

  const loadRooms = useCallback(async () => {
    if (!getAdminToken()) return;
    try {
      setRooms(await fetchAdminRooms());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat ruang");
    }
  }, []);

  const loadBookings = useCallback(async () => {
    if (!getAdminToken()) return;
    setLoadingBookings(true);
    try {
      setBookings(await fetchAdminBookings());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat jadwal");
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) {
      loadRooms();
      loadBookings();
    }
  }, [unlocked, loadRooms, loadBookings]);

  async function tryLogin(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const result = await loginAdmin(username, password);
      setAdminSession(result.token, result.username);
      setAdminName(result.username);
      setUnlocked(true);
      setPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Login gagal");
    }
  }

  function logout() {
    clearAdminSession();
    setUnlocked(false);
    setUsername("");
    setRooms([]);
    setBookings([]);
  }

  async function onRoomSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createRoom({
        name: String(fd.get("name")),
        floor: String(fd.get("floor") || "") || undefined,
        capacity: fd.get("capacity")
          ? Number(fd.get("capacity"))
          : undefined,
        sortOrder: fd.get("sortOrder")
          ? Number(fd.get("sortOrder"))
          : undefined,
      });
      setMessage("Ruang berhasil ditambahkan");
      e.currentTarget.reset();
      await loadRooms();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan ruang");
    }
  }

  async function onBookingSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    if (rooms.length === 0) {
      setMessage("Tambahkan ruang rapat terlebih dahulu");
      return;
    }
    try {
      await createBooking({
        roomId: String(fd.get("roomId")),
        title: String(fd.get("title")),
        organizer: String(fd.get("organizer") || "") || null,
        department: String(fd.get("department") || "") || null,
        description: null,
        startAt: new Date(String(fd.get("startAt"))).toISOString(),
        endAt: new Date(String(fd.get("endAt"))).toISOString(),
      });
      setMessage("Jadwal berhasil disimpan");
      e.currentTarget.reset();
      await loadBookings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function removeBooking(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await deleteBooking(id);
      setMessage("Jadwal dihapus");
      await loadBookings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  async function removeRoom(id: string) {
    if (!confirm("Hapus ruang ini? Jadwal terkait ikut terhapus.")) return;
    try {
      await deleteRoom(id);
      setMessage("Ruang dihapus");
      await loadRooms();
      await loadBookings();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus ruang");
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
        <form className="admin-form admin-form--login" onSubmit={tryLogin}>
          <h2>Masuk Dashboard Admin</h2>
          <p>
            Kelola ruang rapat dan jadwal. Tampilan TV hanya membaca data dari
            database.
          </p>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
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
      <div className="admin-topbar">
        <span>
          Login sebagai <strong>{adminName}</strong>
        </span>
        <button type="button" className="btn-ghost" onClick={logout}>
          Keluar
        </button>
      </div>

      {message && (
        <div
          className="toast-banner"
          data-type={
            message.includes("berhasil") || message.includes("dihapus")
              ? "ok"
              : "err"
          }
        >
          {message}
        </div>
      )}

      <div className="admin-columns admin-columns--triple">
        <section className="admin-card">
          <h2>Tambah ruang rapat</h2>
          <form className="admin-form" onSubmit={onRoomSubmit}>
            <label>
              Nama ruang
              <input name="name" required placeholder="Ruang Rapat 1" />
            </label>
            <label>
              Lantai
              <input name="floor" placeholder="Lantai 1" />
            </label>
            <label>
              Kapasitas
              <input name="capacity" type="number" min={1} placeholder="12" />
            </label>
            <label>
              Urutan tampil di TV
              <input name="sortOrder" type="number" defaultValue={0} />
            </label>
            <button type="submit" className="btn-primary">
              Simpan ruang
            </button>
          </form>
          <h3>Daftar ruang</h3>
          {rooms.length === 0 ? (
            <p className="admin-empty">Belum ada ruang. Isi form di atas.</p>
          ) : (
            <ul className="admin-room-list">
              {rooms.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.name}</strong>
                    <span>
                      {[r.floor, r.capacity ? `${r.capacity} org` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-ghost--danger"
                    onClick={() => removeRoom(r.id)}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <h2>Tambah jadwal rapat</h2>
          <form className="admin-form" onSubmit={onBookingSubmit}>
            <label>
              Ruang
              <select name="roomId" required disabled={rooms.length === 0}>
                {rooms.length === 0 && <option value="">—</option>}
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Judul rapat / kegiatan
              <input name="title" required />
            </label>
            <label>
              Penyelenggara
              <input name="organizer" />
            </label>
            <label>
              Unit / instalasi
              <input name="department" />
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
              Simpan jadwal
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
            <p className="admin-empty">Belum ada jadwal.</p>
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
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost btn-ghost--danger"
                          onClick={() => removeBooking(b.id)}
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
