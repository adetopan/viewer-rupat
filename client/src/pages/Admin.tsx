import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createBooking,
  deleteBooking,
  fetchAdminBookings,
  fetchAdminRooms,
  loginAdmin,
  updateBooking,
  type AdminBooking,
  type RoomRecord,
} from "../api";
import {
  getAdminToken,
  getAdminUsername,
  setAdminSession,
} from "../lib/authSession";
import { formatDateTable, formatTime } from "../lib/format";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat__value">{value}</span>
      <span className="admin-stat__label">{label}</span>
    </div>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="admin-card__head">
      <h2>{title}</h2>
      {subtitle ? <p className="admin-card__sub">{subtitle}</p> : null}
    </div>
  );
}

type BookingDraft = {
  roomId: string;
  title: string;
  organizer: string;
  department: string;
  startAt: string;
  endAt: string;
};

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDraft(rooms: RoomRecord[]): BookingDraft {
  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);
  return {
    roomId: rooms[0]?.id ?? "",
    title: "",
    organizer: "",
    department: "",
    startAt: toLocalInput(defaultStart),
    endAt: toLocalInput(defaultEnd),
  };
}

function draftFromBooking(b: AdminBooking): BookingDraft {
  return {
    roomId: b.roomId,
    title: b.title,
    organizer: b.organizer ?? "",
    department: b.department ?? "",
    startAt: toLocalInput(new Date(b.startAt)),
    endAt: toLocalInput(new Date(b.endAt)),
  };
}

export function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(() => !!getAdminToken());
  const [adminName, setAdminName] = useState(() => getAdminUsername() ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"ok" | "err" | "info">("info");
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft>(() => defaultDraft([]));

  const loadRooms = useCallback(async () => {
    if (!getAdminToken()) return;
    try {
      const list = await fetchAdminRooms();
      setRooms(list);
      setDraft((d) => (d.roomId ? d : defaultDraft(list)));
    } catch (err) {
      setMessageKind("err");
      setMessage(err instanceof Error ? err.message : "Gagal memuat ruang");
    }
  }, []);

  const loadBookings = useCallback(async () => {
    if (!getAdminToken()) return;
    setLoadingBookings(true);
    try {
      setBookings(await fetchAdminBookings());
    } catch (err) {
      setMessageKind("err");
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

  function cancelEdit() {
    setEditingId(null);
    setDraft(defaultDraft(rooms));
  }

  function startEdit(b: AdminBooking) {
    setEditingId(b.id);
    setDraft(draftFromBooking(b));
    setMessage(null);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function tryLogin(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMessageKind("info");
    try {
      const result = await loginAdmin(username, password);
      setAdminSession(result.token, result.username);
      setAdminName(result.username);
      setUnlocked(true);
      setPassword("");
    } catch (err) {
      setMessageKind("err");
      setMessage(err instanceof Error ? err.message : "Login gagal");
    }
  }

  async function onBookingSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    if (rooms.length === 0) {
      setMessageKind("err");
      setMessage("Ruang belum tersedia. Restart server atau jalankan npm run db:seed");
      return;
    }
    const organizer = draft.organizer.trim();
    const department = draft.department.trim();
    const payload = {
      roomId: draft.roomId,
      title: draft.title.trim(),
      organizer: organizer || undefined,
      department: department || undefined,
      startAt: new Date(draft.startAt).toISOString(),
      endAt: new Date(draft.endAt).toISOString(),
    };
  if (!payload.title) {
      setMessageKind("err");
      setMessage("Judul rapat wajib diisi");
      return;
    }
    try {
      if (editingId) {
        await updateBooking(editingId, payload);
        setMessageKind("ok");
        setMessage("Jadwal berhasil diperbarui");
        setEditingId(null);
      } else {
        await createBooking(payload);
        setMessageKind("ok");
        setMessage("Jadwal berhasil disimpan");
      }
      setDraft(defaultDraft(rooms));
      await loadBookings();
    } catch (err) {
      setMessageKind("err");
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function removeBooking(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await deleteBooking(id);
      setMessageKind("ok");
      setMessage("Jadwal dihapus");
      if (editingId === id) cancelEdit();
      await loadBookings();
    } catch (err) {
      setMessageKind("err");
      setMessage(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  const filtered =
    filterRoom === "all"
      ? bookings
      : bookings.filter((b) => b.roomId === filterRoom);

  if (!unlocked) {
    return (
      <div className="admin-login">
        <p className="admin-login__badge">Portal Admin</p>
        <form className="admin-form admin-form--login" onSubmit={tryLogin}>
          <h2>Masuk Dashboard</h2>
          <p>Kelola jadwal rapat untuk semua ruang. Perubahan langsung tampil di TV.</p>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
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
              placeholder="••••••••"
              required
            />
          </label>
          {message && (
            <div className="toast-banner" data-type="err">
              {message}
            </div>
          )}
          <button type="submit" className="btn-primary btn-primary--wide">
            Masuk ke dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div className="admin-hero__text">
          <h2 className="admin-hero__title">Kelola jadwal rapat</h2>
          <p className="admin-hero__sub">
            Masuk sebagai <strong>{adminName}</strong> · data sinkron ke tampilan TV
          </p>
        </div>
        <div className="admin-stats">
          <StatCard label="Ruang aktif" value={rooms.length} />
          <StatCard label="Jadwal aktif" value={bookings.length} />
          <StatCard
            label="Ditampilkan"
            value={
              filtered.length === bookings.length
                ? "Semua jadwal"
                : `${filtered.length} jadwal`
            }
          />
        </div>
      </div>

      {message && (
        <div className="toast-banner" data-type={messageKind}>
          {message}
        </div>
      )}

      <section className="admin-card admin-card--rooms-info">
        <div className="admin-card__head">
          <h2>Ruang rapat</h2>
          <span className="admin-pill">4 ruang tetap · otomatis di TV</span>
        </div>
        <div className="admin-room-grid">
          {rooms.map((r) => (
            <article key={r.id} className="admin-room-tile">
              <h3>{r.name}</h3>
              <p>{r.floor ?? "—"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-columns">
        <section className="admin-card admin-card--form" id="booking-form">
          <CardHead
            title={editingId ? "Ubah jadwal" : "Tambah jadwal"}
            subtitle={
              editingId
                ? "Perbaiki data lalu simpan perubahan"
                : "Isi detail rapat lalu simpan"
            }
          />
          <form className="admin-form admin-form--booking" onSubmit={onBookingSubmit}>
            <label>
              Ruang
              <select
                required
                value={draft.roomId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, roomId: e.target.value }))
                }
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.floor})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Judul rapat / kegiatan
              <input
                required
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
              />
            </label>
            <label>
              Penyelenggara
              <input
                value={draft.organizer}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, organizer: e.target.value }))
                }
              />
            </label>
            <label>
              Unit / instalasi
              <input
                value={draft.department}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, department: e.target.value }))
                }
              />
            </label>
            <div className="admin-form__row">
              <label>
                Mulai
                <input
                  type="datetime-local"
                  required
                  value={draft.startAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, startAt: e.target.value }))
                  }
                />
              </label>
              <label>
                Selesai
                <input
                  type="datetime-local"
                  required
                  value={draft.endAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endAt: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="admin-form__actions">
              <button type="submit" className="btn-primary">
                {editingId ? "Simpan perubahan" : "Simpan jadwal"}
              </button>
              {editingId ? (
                <button type="button" className="btn-ghost" onClick={cancelEdit}>
                  Batal
                </button>
              ) : null}
            </div>
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
            <div className="admin-empty-state">
              <p className="admin-empty-state__title">Belum ada jadwal</p>
              <p className="admin-empty-state__sub">
                Tambahkan rapat di formulir sebelah kiri. Jadwal akan muncul di sini dan di TV.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-table__col-date">Tanggal</th>
                    <th className="admin-table__col-time">Waktu</th>
                    <th className="admin-table__col-room">Ruang</th>
                    <th className="admin-table__col-title">Informasi kegiatan</th>
                    <th className="admin-table__col-action">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const dateParts = formatDateTable(b.startAt);
                    const isEditing = editingId === b.id;
                    return (
                      <tr key={b.id} data-editing={isEditing ? "true" : undefined}>
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
                        <td className="admin-table__actions">
                          <button
                            type="button"
                            className="btn-ghost btn-ghost--accent"
                            onClick={() => startEdit(b)}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-ghost--danger"
                            onClick={() => removeBooking(b.id)}
                          >
                            Hapus
                          </button>
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
    </div>
  );
}
