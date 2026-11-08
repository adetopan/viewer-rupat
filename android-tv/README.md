# Instalasi di Android TV

**Satu TV** memuat halaman utama yang menampilkan **semua ruang rapat** dalam satu layar (grid 2×2).

**URL server RS:** http://10.5.1.50:3001/

## Opsi A — Browser TV

1. Pastikan server berjalan di **10.5.1.50** port **3001**.
2. Di Android TV, buka browser: **http://10.5.1.50:3001/**
3. Admin dari komputer: **http://10.5.1.50:3001/admin**

## Opsi B — APK WebView

1. Buka `android-app` di Android Studio.
2. `server_url` di `strings.xml` sudah: `http://10.5.1.50:3001/`
3. Build APK dan pasang di TV.
