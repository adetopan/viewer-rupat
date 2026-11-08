import { Outlet, Link, NavLink } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="layout layout--admin">
      <header className="header header--admin">
        <div className="header-brand">
          <img src="/logo.png" alt="" width={56} height={56} />
          <div className="header-titles">
            <h1>Dashboard Admin</h1>
            <p>Input &amp; kelola jadwal ruang rapat</p>
          </div>
        </div>
        <nav className="nav-links admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`
            }
          >
            Kelola jadwal
          </NavLink>
          <NavLink
            to="/admin/rekap"
            className={({ isActive }) =>
              `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`
            }
          >
            Rekap jadwal
          </NavLink>
          <NavLink
            to="/admin/pengaturan"
            className={({ isActive }) =>
              `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`
            }
          >
            Pengaturan
          </NavLink>
          <Link to="/" className="btn-ghost btn-ghost--accent">
            Lihat tampilan TV →
          </Link>
        </nav>
      </header>
      <main className="main main--admin">
        <Outlet />
      </main>
    </div>
  );
}
