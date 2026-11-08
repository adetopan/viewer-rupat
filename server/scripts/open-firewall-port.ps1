# Jalankan PowerShell sebagai Administrator — buka port 3001 untuk TV & admin di LAN
$ruleName = "Rupat Ruang Rapat HTTP 3001"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Aturan firewall sudah ada: $ruleName"
} else {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3001 `
        -Action Allow `
        -Profile Domain, Private
    Write-Host "Port 3001 dibuka (Inbound TCP)."
}
