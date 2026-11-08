# Jalankan sebagai user yang bisa akses PostgreSQL (biasanya tanpa password untuk postgres di localhost).
# Contoh: powershell -File setup-windows-postgres.ps1

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
    Write-Error "psql tidak ditemukan. Sesuaikan path versi PostgreSQL Anda."
    exit 1
}

& $psql -U postgres -h localhost -p 5432 -v ON_ERROR_STOP=1 @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rupat') THEN
    CREATE USER rupat WITH PASSWORD 'rupat_secret';
  END IF;
END `$`$;
"@

$dbExists = & $psql -U postgres -h localhost -p 5432 -tAc "SELECT 1 FROM pg_database WHERE datname = 'rupat'"
if (-not ($dbExists -match "1")) {
    & $psql -U postgres -h localhost -p 5432 -v ON_ERROR_STOP=1 -c "CREATE DATABASE rupat OWNER rupat;"
}
& $psql -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE rupat TO rupat;"

Write-Host "Database siap. Lanjutkan:"
Write-Host "  cd D:\viewer rupat\server"
Write-Host "  npx prisma db push"
Write-Host "  npm run db:seed"
Write-Host "  npm start"
