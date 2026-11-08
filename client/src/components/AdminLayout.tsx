import { Outlet, Link } from "react-router-dom";

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
        <nav className="nav-links">
          <Link to="/" className="btn-ghost">
            Buka tampilan TV
          </Link>
        </nav>
      </header>
      <main className="main main--admin">
        <Outlet />
      </main>
    </div>
  );
}
