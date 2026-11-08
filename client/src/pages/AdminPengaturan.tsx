import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { changeAdminPassword } from "../api";
import {
  clearAdminSession,
  getAdminToken,
  getAdminUsername,
} from "../lib/authSession";

export function AdminPengaturan() {
  const authed = !!getAdminToken();
  const adminName = getAdminUsername() ?? "admin";
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"ok" | "err">("ok");

  if (!authed) {
    return <Navigate to="/admin" replace />;
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newPw = String(fd.get("newPassword"));
    const newPw2 = String(fd.get("newPassword2"));
    if (newPw !== newPw2) {
      setMessageKind("err");
      setMessage("Password baru tidak cocok");
      return;
    }
    try {
      await changeAdminPassword(String(fd.get("currentPassword")), newPw);
      setMessageKind("ok");
      setMessage("Password berhasil diubah");
      form.reset();
    } catch (err) {
      setMessageKind("err");
      setMessage(err instanceof Error ? err.message : "Gagal mengubah password");
    }
  }

  function logout() {
    clearAdminSession();
    navigate("/admin", { replace: true });
  }

  return (
    <div className="admin-dashboard admin-settings">
      <div className="admin-hero">
        <div className="admin-hero__text">
          <h2 className="admin-hero__title">Pengaturan</h2>
          <p className="admin-hero__sub">
            Akun <strong>{adminName}</strong> · keamanan dan sesi admin
          </p>
        </div>
      </div>

      {message && (
        <div className="toast-banner" data-type={messageKind}>
          {message}
        </div>
      )}

      <section className="admin-card admin-settings__card">
        <h2>Ganti password</h2>
        <p className="admin-card__sub">
          Password minimal 6 karakter. Setelah diubah, gunakan password baru saat login berikutnya.
        </p>
        <form className="admin-form admin-settings__form" onSubmit={onPasswordSubmit}>
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

      <section className="admin-card admin-settings__card admin-settings__card--danger">
        <h2>Keluar</h2>
        <p className="admin-card__sub">
          Akhiri sesi admin di browser ini. Anda perlu login lagi untuk mengelola jadwal.
        </p>
        <button type="button" className="btn-ghost btn-ghost--danger" onClick={logout}>
          Keluar dari dashboard
        </button>
      </section>
    </div>
  );
}
