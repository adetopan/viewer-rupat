# Build APK untuk Android TV

APK ini membuka viewer ruang rapat (`/`) dalam WebView — cocok untuk TV di jaringan RS.

## 1. Atur URL server

Edit `android-app/app/src/main/res/values/strings.xml`:

```xml
<string name="server_url">http://10.5.1.50:3001/</string>
```

| Lingkungan | URL contoh |
|--------------|------------|
| Server produksi RS | `http://10.5.1.50:3001/` |
| Emulator Android Studio (server di PC yang sama) | `http://10.0.2.2:3001/` |
| Tes LAN dari HP/TV (ganti IP PC server) | `http://192.168.x.x:3001/` |

Pastikan `server/.env` memakai `HOST=0.0.0.0` dan server sudah `npm start`.

## 2. Build dengan Android Studio (disarankan)

1. Pasang [Android Studio](https://developer.android.com/studio).
2. **File → Open** → pilih folder `viewer-rupat/android-tv/android-app`.
3. **JDK 17** (bukan JDK 25): **File → Settings → Build → Gradle → Gradle JDK** → pilih **jbr-17** atau JDK 17.
4. **File → Sync Project with Gradle Files** (wajib **Gradle 8.4** + AGP **8.2.2** — **jangan Gradle 9.x**).
5. Jika masih error: **Build → Clean Project**, lalu **File → Invalidate Caches → Restart**.
6. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
7. APK ada di:  
   `android-app/app/build/outputs/apk/debug/app-debug.apk`

Untuk rilis internal: **Build → Generate Signed Bundle / APK**.

## 3. Pasang di TV

1. Salin APK ke USB atau kirim lewat **Send Files to TV** / **adb**.
2. Di TV: aktifkan **Instal dari sumber tidak dikenal** (jika diminta).
3. Buka APK → install → jalankan **Ruang Rapat Pusdokkes**.

## 4. adb (opsional)

```bash
adb connect ALAMAT_IP_TV:5555
adb install -r app-debug.apk
```

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Cannot mutate the dependencies of configuration ... debugCompileClasspath` | Gradle **9.x** + AGP lama tidak cocok. `git pull`, sync ulang, pakai JDK **17**, atau jalankan `gradlew.bat assembleDebug` |
| Layar putih | Cek `server_url`, firewall port 3001, server nyala |
| Tidak bisa HTTP | `usesCleartextTraffic` sudah aktif di manifest |
| Token / admin | APK hanya untuk **viewer TV**; admin tetap lewat browser `/admin` |

## 3b. Build lewat command line (Windows)

```powershell
cd android-tv\android-app
.\gradlew.bat clean assembleDebug
```

APK: `app\build\outputs\apk\debug\app-debug.apk`
