/** Ruang tetap RS — tidak bisa ditambah/hapus lewat admin. */
export const FIXED_ROOMS = [
  {
    slug: "ruang-rapat-1",
    name: "Ruang Rapat 1",
    floor: "Lantai 3",
    sortOrder: 1,
  },
  {
    slug: "ruang-rapat-2",
    name: "Ruang Rapat 2",
    floor: "Lantai 3",
    sortOrder: 2,
  },
  {
    slug: "aula-boediharto",
    name: "Aula Boediharto",
    floor: "Lantai 3",
    sortOrder: 3,
  },
  {
    slug: "ruang-rapat-lt2",
    name: "Ruang Rapat Lt2",
    floor: "Lantai 2",
    sortOrder: 4,
  },
] as const;
