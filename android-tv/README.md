# Instalasi di Android TV

**Satu TV** memuat halaman utama yang menampilkan **semua ruang rapat** dalam satu layar (grid 2×2).

> **Sinkron dengan client & server:** APK hanya membuka browser ke URL server (`server_url`). UI dan logika viewer/admin = file `client/dist` + API `server`. Setelah `npm run build` (client + server) dan restart server, TV/APK otomatis dapat tampilan baru (refresh / buka ulang app). **Rebuild APK** hanya perlu jika mengubah `strings.xml` (IP), `MainActivity.kt`, atau ikon app.

**URL server RS:** http://10.5.1.50:3001/

## Opsi A — Browser TV

1. Pastikan server berjalan di **10.5.1.50** port **3001**.
2. Di Android TV, buka browser: **http://10.5.1.50:3001/**
3. Admin dari komputer: **http://10.5.1.50:3001/admin**

## Opsi B — APK WebView

Panduan lengkap: **[BUILD-APK.md](BUILD-APK.md)**

1. Buka `android-app` di Android Studio.
2. Sesuaikan `server_url` di `strings.xml` (IP server RS).
3. Build APK → pasang di TV (LEANBACK launcher didukung).
4. Layar tetap menyala saat app aktif (cocok untuk TV kiosk).
