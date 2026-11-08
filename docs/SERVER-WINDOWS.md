# Panduan server — Windows Server / Windows 10–11

Server aplikasi + **PostgreSQL** di **satu mesin Windows** (tanpa Docker).  
IP contoh RS: **10.5.1.50**

## Yang terpasang di server

| Komponen | Keterangan |
|----------|------------|
| **Node.js** 20 LTS | https://nodejs.org |
| **PostgreSQL** | Service Windows, mis. `postgresql-x64-18` |
| **Git** + clone repo | mis. `G:\viewer-rupat` |

---

## Instalasi pertama (sekali)

Buka **PowerShell**:

```powershell
cd G:\viewer-rupat\server
copy .env.example .env
# pastikan PUBLIC_HOST=10.5.1.50 dan DATABASE_URL benar

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

**Firewall** (PowerShell **Administrator**):

```powershell
cd G:\viewer-rupat\server
powershell -ExecutionPolicy Bypass -File scripts\open-firewall-port.ps1
```

Pastikan adapter jaringan server memakai IP **10.5.1.50** (Pengaturan Windows → Jaringan).

---

## Menjalankan aplikasi

```powershell
cd G:\viewer-rupat\server
npm start
```

| Akses | URL |
|--------|-----|
| TV / viewer | http://10.5.1.50:3001/ |
| Admin | http://10.5.1.50:3001/admin |
| Cek API | http://10.5.1.50:3001/api/health |

Login admin: `ADMIN_USERNAME` / `ADMIN_PASSWORD` di `.env` (default `admin` / `Jagakarsa28`).

---

## Jalan otomatis saat Windows nyala (opsional)

### Opsi A — Task Scheduler

1. Buka **Task Scheduler** → Create Task.
2. Trigger: **At startup** atau **At log on** (user layanan).
3. Action: Start a program  
   - Program: `C:\Program Files\nodejs\node.exe`  
   - Arguments: `dist\index.js`  
   - Start in: `G:\viewer-rupat\server`

### Opsi B — NSSM (Windows Service)

1. Unduh [NSSM](https://nssm.cc/download).
2. `nssm install RupatViewer` → path `node.exe`, argument `G:\viewer-rupat\server\dist\index.js`, startup folder `G:\viewer-rupat\server`.

---

## Setelah `git pull`

```powershell
cd G:\viewer-rupat\client
npm install
npm run build

cd ..\server
npm install
npx prisma db push
npm run build
npm start
```

Jangan jalankan `npm run db:seed` jika data ruang/jadwal sudah dipakai (seed mengosongkan ruang & jadwal).

---

## Layanan yang harus Running

Buka `services.msc`:

- **PostgreSQL** — Running, Start: Automatic  
- Aplikasi Node — `npm start` atau layanan NSSM / Task Scheduler

---

## Android TV

Browser: buka **http://10.5.1.50:3001/**  
ATAU build APK dari `android-tv/android-app` (`server_url` sudah 10.5.1.50).
