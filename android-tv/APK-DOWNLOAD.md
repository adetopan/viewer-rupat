# Unduh APK (tanpa Android Studio)

Di PC ini **tidak ada Java/Android SDK**, jadi APK tidak bisa di-build lokal. Gunakan satu cara berikut.

## Opsi 1 — GitHub Actions (disarankan)

1. Push project ke GitHub (repo privat/public).
2. Buka tab **Actions** → workflow **Build Android TV APK** → **Run workflow**.
3. Setelah selesai (~5–10 menit), buka run tersebut → bagian **Artifacts** → unduh **ruang-rapat-tv-apk**.
4. Di dalam zip ada `app-debug.apk` → pasang di Android TV.

Sebelum build, sesuaikan IP server di  
`android-app/app/src/main/res/values/strings.xml` → `server_url`.

## Opsi 2 — Browser TV (tanpa APK)

Di TV: buka browser → `http://IP_SERVER:3001/`  
Halaman viewer sudah **fullscreen otomatis** (klik layar sekali jika browser meminta).

## Opsi 3 — PC lain + Android Studio

Lihat [BUILD-APK.md](BUILD-APK.md).
