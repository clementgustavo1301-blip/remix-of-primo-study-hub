# Script para corrigir problema de DNS do Supabase
# Execute como Administrador: Clique com botão direito → "Executar como Administrador"

Write-Host "Configurando DNS do Google para resolver domínio do Supabase..." -ForegroundColor Green

# Adicionar entrada no arquivo hosts
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entry = "172.64.149.246 pbgdgvwfydewnshjmcqa.supabase.co"

# Verificar se a entrada já existe
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
if ($hostsContent -notcontains $entry) {
    Add-Content -Path $hostsPath -Value "`n$entry"
    Write-Host "✓ Entrada adicionada ao arquivo hosts" -ForegroundColor Green
} else {
    Write-Host "✓ Entrada já existe no arquivo hosts" -ForegroundColor Yellow
}

# Limpar cache DNS
Write-Host "`nLimpando cache DNS..." -ForegroundColor Green
ipconfig /flushdns | Out-Null
Write-Host "✓ Cache DNS limpo" -ForegroundColor Green

# Testar resolução DNS
Write-Host "`nTestando resolução DNS..." -ForegroundColor Green
$result = nslookup pbgdgvwfydewnshjmcqa.supabase.co 2>&1
if ($result -match "172.64.149.246") {
    Write-Host "✓ DNS resolvido com sucesso!" -ForegroundColor Green
    Write-Host "`nAgora você pode fazer login no seu aplicativo!" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Ainda há problemas com DNS. Tente reiniciar o navegador." -ForegroundColor Yellow
}

Write-Host "`nPressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
