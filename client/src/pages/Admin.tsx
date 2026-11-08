import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  changeAdminPassword,
  createBooking,
  deleteBooking,
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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
    setShowPasswordForm(false);
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newPw = String(fd.get("newPassword"));
    const newPw2 = String(fd.get("newPassword2"));
    if (newPw !== newPw2) {
      setMessage("Password baru tidak cocok");
      return;
    }
    try {
      await changeAdminPassword(String(fd.get("currentPassword")), newPw);
      setMessage("Password berhasil diubah");
      form.reset();
      setShowPasswordForm(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengubah password");
    }
  }

  async function onBookingSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (rooms.length === 0) {
      setMessage("Ruang belum tersedia. Restart server atau jalankan npm run db:seed");
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
      form.reset();
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
          <p>Kelola jadwal ruang rapat. Ruang tetap ditampilkan di TV.</p>
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
        <div className="admin-topbar__actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowPasswordForm((v) => !v)}
          >
            Ganti password
          </button>
          <button type="button" className="btn-ghost" onClick={logout}>
            Keluar
          </button>
        </div>
      </div>

      {showPasswordForm && (
        <section className="admin-card admin-card--password">
          <h2>Ganti password admin</h2>
          <form className="admin-form admin-form--inline" onSubmit={onPasswordSubmit}>
            <label>
              Password lama
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              Password baru
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <label>
              Ulangi password baru
              <input
                type="password"
                name="newPassword2"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <button type="submit" className="btn-primary">
              Simpan password
            </button>
          </form>
        </section>
      )}

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

      <section className="admin-card admin-card--rooms-info">
        <h2>Ruang rapat (tetap)</h2>
        <ul className="admin-room-list admin-room-list--static">
          {rooms.map((r) => (
            <li key={r.id}>
              <strong>{r.name}</strong>
              <span>{r.floor ?? ""}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-columns">
        <section className="admin-card">
          <h2>Tambah jadwal rapat</h2>
          <form className="admin-form" onSubmit={onBookingSubmit}>
            <label>
              Ruang
              <select name="roomId" required>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.floor})
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
