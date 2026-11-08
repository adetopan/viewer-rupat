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
