export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Tanggal ringkas untuk tabel admin (muat di kolom sempit). */
export function formatDateTable(iso: string) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("id-ID", { weekday: "short" });
  const rest = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { weekday, rest };
}

export function statusLabel(status: string) {
  switch (status) {
    case "berlangsung":
      return "Sedang Dipakai";
    case "akan_datang":
      return "Akan Digunakan";
    default:
      return "Tersedia";
  }
}
