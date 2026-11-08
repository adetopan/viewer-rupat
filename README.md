# Viewer Ruang Rapat — RS Bhayangkara TK I Pusdokkes Polri

Aplikasi berjalan di **server Windows** + **PostgreSQL** (tanpa Docker). Satu TV menampilkan semua ruang; admin mengisi jadwal lewat browser.

**Panduan lengkap server Windows:** [docs/SERVER-WINDOWS.md](docs/SERVER-WINDOWS.md)

## URL (server RS — IP 10.5.1.50)

| Peran | URL |
|--------|-----|
| **Viewer (TV)** | http://10.5.1.50:3001/ |
| **Admin** | http://10.5.1.50:3001/admin |

Di mesin server sendiri bisa juga: http://localhost:3001/

Login admin: username **`admin`**, password **`ADMIN_PASSWORD`** di `server/.env` (default **Jagakarsa28**).

---

## Prasyarat (Windows)

1. **Node.js** 20+
2. **PostgreSQL** — service **Running** (`services.msc`)
3. Repo di-clone, mis. `G:\viewer-rupat`

---

## Instalasi pertama (PowerShell)

```powershell
cd G:\viewer-rupat\server
copy .env.example .env
$env:PGPASSWORD = "PASSWORD_USER_POSTGRES"
powershell -ExecutionPolicy Bypass -File scripts\setup-windows-postgres.ps1
npm install
npx prisma db push
npm run db:seed

cd ..\client
npm install
npm run build

cd ..\server
npm run build
```

Buka port untuk TV (PowerShell **Administrator**):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\open-firewall-port.ps1
```

---

## Jalankan setiap hari

```powershell
cd G:\viewer-rupat\server
npm start
```

Otomatis saat Windows nyala: lihat Task Scheduler / NSSM di [docs/SERVER-WINDOWS.md](docs/SERVER-WINDOWS.md).

---

## Konfigurasi `server/.env`

```env
DATABASE_URL="postgresql://rupat:Jagakarsa28@localhost:5432/rupat?schema=public"
PORT=3001
HOST=0.0.0.0
PUBLIC_HOST=10.5.1.50
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Jagakarsa28
JWT_SECRET=rupat-jwt-ganti-di-server
```

`HOST=0.0.0.0` agar TV dan PC lain di LAN bisa akses.

---

## Troubleshooting

### P1000 — Authentication failed

Password user PostgreSQL **`rupat`** tidak cocok dengan `DATABASE_URL`. Jalankan ulang `scripts\setup-windows-postgres.ps1` (lihat [docs/SERVER-WINDOWS.md](docs/SERVER-WINDOWS.md)).

### Ruang tetap (4)

Ruang Rapat 1 (Lt 3), Rapat 2 (Lt 3), Aula Boediharto (Lt 3), Rapat Lt2 (Lt 2) — dibuat otomatis saat `npm start` atau `npm run db:seed`.

Admin hanya mengisi **jadwal**. Ganti password lewat **Ganti password** di dashboard.

---

## Android TV

[android-tv/README.md](android-tv/README.md) — browser **http://10.5.1.50:3001/** atau APK ([cara unduh APK tanpa Android Studio](android-tv/APK-DOWNLOAD.md)).

## Struktur

- `client/` — viewer + admin (build → `client/dist`)
- `server/` — API Node.js + menyajikan file statis TV
- `docs/SERVER-WINDOWS.md` — panduan khusus Windows
