import { Routes, Route, Navigate } from "react-router-dom";
import { ViewerLayout } from "./components/ViewerLayout";
import { AdminLayout } from "./components/AdminLayout";
import { Viewer } from "./pages/Viewer";
import { Admin } from "./pages/Admin";
import { AdminRekap } from "./pages/AdminRekap";
import { AdminPengaturan } from "./pages/AdminPengaturan";

export default function App() {
  return (
    <Routes>
      <Route element={<ViewerLayout />}>
        <Route path="/" element={<Viewer />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/rekap" element={<AdminRekap />} />
        <Route path="/admin/pengaturan" element={<AdminPengaturan />} />
      </Route>
      <Route path="/ruang/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
