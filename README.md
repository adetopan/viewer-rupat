# Viewer Ruang Rapat — RS Bhayangkara TK I Pusdokkes Polri

Aplikasi **lokal**: PostgreSQL di Windows (tanpa Docker), Node.js + React. Satu layar TV menampilkan keempat ruang; admin mengisi jadwal di browser.

## URL (mode lokal di PC ini)

| Peran | URL |
|--------|-----|
| **Viewer (TV / browser)** | http://localhost:3001/ |
| **Admin** | http://localhost:3001/admin |

Nanti jika dipasang di jaringan RS (IP **10.5.1.10**), ganti `PUBLIC_HOST` di `server/.env` dan buka http://10.5.1.10:3001/ dari TV.

PIN admin default: **1234** (`server/.env`).

---

## Prasyarat

1. **Node.js** 20+
2. **PostgreSQL** (service Windows harus **Running** — di PC Anda: PostgreSQL 18)
3. **`npm install`** di folder `server` dan `client`

---

## Instalasi pertama (sekali saja)

```powershell
cd "D:\viewer rupat\server"
npm install
npm run db:local-init

cd "D:\viewer rupat\client"
npm install
npm run build
```

Perintah `db:local-init` membuat user/database PostgreSQL, tabel, dan data awal 4 ruang.

Jika psql meminta **Password for user postgres**, set password superuser dulu (sesuaikan jika berbeda):

```powershell
$env:PGPASSWORD = "Jagakarsa28"
npm run db:local-init
```

Jika error *User was denied access*, pastikan service PostgreSQL nyala di *services.msc*.

---

## Menjalankan setiap hari

### Opsi 1 — Satu perintah (produksi lokal, sudah ada build client)

```powershell
cd "D:\viewer rupat\server"
npm start
```

Buka **http://localhost:3001/** (viewer) dan **http://localhost:3001/admin**.

### Opsi 2 — Mode pengembangan (hot reload)

```powershell
cd "D:\viewer rupat"
npm install
npm run dev
```

- Viewer: http://localhost:5173/  
- Admin: http://localhost:5173/admin  
- API: http://localhost:3001  

---

## Isi jadwal

1. Buka http://localhost:3001/admin  
2. Masuk PIN **1234**  
3. Isi form → **Simpan**  
4. Viewer di http://localhost:3001/ refres otomatis (~8 detik)

---

## Konfigurasi database

File `server/.env`:

```env
DATABASE_URL="postgresql://rupat:Jagakarsa28@localhost:5432/rupat?schema=public"
PORT=3001
HOST=0.0.0.0
PUBLIC_HOST=localhost
ADMIN_PIN=1234
```

Sesuaikan kata sandi di `DATABASE_URL` jika Anda mengubah password user `rupat` di PostgreSQL.

---

## Android TV (nanti)

Browser TV atau APK — lihat [android-tv/README.md](android-tv/README.md). Untuk uji di rumah, APK bisa mengarah ke IP PC Anda di LAN; untuk produksi RS gunakan **10.5.1.10**.

---

## Struktur

- `client/` — tampilan viewer + admin  
- `server/` — API + melayani file hasil `client/build`  
- `docker-compose.yml` — **tidak dipakai** (opsional saja jika suatu saat pakai Docker)
