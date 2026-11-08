# Setup database PostgreSQL untuk aplikasi ruang rapat (Windows, tanpa Docker).
#
# Jika psql meminta "Password for user postgres", set dulu password superuser:
#   $env:PGPASSWORD = "Jagakarsa28"
# lalu jalankan lagi: npm run db:local-init

$ErrorActionPreference = "Stop"

function Find-PsqlPath {
    $versions = 18, 17, 16, 15, 14
    foreach ($v in $versions) {
        $path = "C:\Program Files\PostgreSQL\$v\bin\psql.exe"
        if (Test-Path $path) { return $path }
    }
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

$psql = Find-PsqlPath
if (-not $psql) {
    Write-Error "psql tidak ditemukan. Pasang PostgreSQL atau tambahkan psql ke PATH."
    exit 1
}

Write-Host "Menggunakan: $psql"

function Invoke-Psql {
    param(
        [string]$Query,
        [switch]$Quiet,
        [string]$Database = "postgres"
    )
    $args = @("-U", "postgres", "-h", "localhost", "-p", "5432", "-d", $Database) + @("-v", "ON_ERROR_STOP=1")
    if ($Quiet) { $args += "-tAc" } else { $args += "-c" }
    $args += $Query
    $out = & $psql @args
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Perintah psql gagal. Jika diminta password postgres, jalankan: `$env:PGPASSWORD = '...'"
        exit $LASTEXITCODE
    }
    if ($null -eq $out) { return "" }
    if ($out -is [System.Array]) { return ($out -join "`n").Trim() }
    return "$out".Trim()
}

$roleExists = Invoke-Psql -Query "SELECT 1 FROM pg_roles WHERE rolname = 'rupat'" -Quiet
if ($roleExists -ne "1") {
    Write-Host "Membuat user rupat..."
    Invoke-Psql -Query "CREATE USER rupat WITH PASSWORD 'Jagakarsa28';"
} else {
    Write-Host "User rupat sudah ada, memperbarui password..."
}
Invoke-Psql -Query "ALTER USER rupat WITH PASSWORD 'Jagakarsa28';"

$dbExists = Invoke-Psql -Query "SELECT 1 FROM pg_database WHERE datname = 'rupat'" -Quiet
if ($dbExists -ne "1") {
    Write-Host "Membuat database rupat..."
    Invoke-Psql -Query "CREATE DATABASE rupat OWNER rupat;"
} else {
    Write-Host "Database rupat sudah ada."
}
Invoke-Psql -Query "GRANT ALL PRIVILEGES ON DATABASE rupat TO rupat;"
Invoke-Psql -Query "ALTER DATABASE rupat OWNER TO rupat;"

Write-Host "Mengatur hak schema public (PostgreSQL 15+)..."
Invoke-Psql -Database "rupat" -Query "ALTER SCHEMA public OWNER TO rupat;"
Invoke-Psql -Database "rupat" -Query "GRANT ALL ON SCHEMA public TO rupat;"
Invoke-Psql -Database "rupat" -Query "GRANT CREATE ON SCHEMA public TO rupat;"

Write-Host ""
Write-Host "PostgreSQL siap (user + database: rupat)."
