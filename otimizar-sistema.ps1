# Script Único de Otimização de Memória e Processos
# Execute como Administrador

Write-Host "=== OTIMIZAÇÃO DO SISTEMA ===" -ForegroundColor Cyan
Write-Host ""

# Memória Atual
$mem = Get-CimInstance Win32_OperatingSystem
$total = [math]::Round($mem.TotalVisibleMemorySize/1MB,2)
$free = [math]::Round($mem.FreePhysicalMemory/1MB,2)
$used = $total - $free
$percent = [math]::Round(($used/$total)*100,2)

Write-Host "RAM: $used GB / $total GB ($percent%) | Livre: $free GB" -ForegroundColor $(if($percent -gt 80){"Red"}elseif($percent -gt 60){"Yellow"}else{"Green"})
Write-Host ""

# Top 10 Processos
Write-Host "TOP 10 PROCESSOS:" -ForegroundColor Yellow
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 | ForEach-Object {
    $memMB = [math]::Round($_.WorkingSet64/1MB,2)
    Write-Host "  $($_.ProcessName.PadRight(20)) $($memMB.ToString().PadLeft(8)) MB"
}
Write-Host ""

# Processos Agrupados (mais importantes)
Write-Host "PROCESSOS AGRUPADOS:" -ForegroundColor Yellow
$groups = @("chrome", "cursor", "msedge", "firefox", "discord", "spotify", "steam", "docker")
foreach($group in $groups) {
    $procs = Get-Process -Name $group -ErrorAction SilentlyContinue
    if($procs) {
        $totalMem = ($procs | Measure-Object WorkingSet64 -Sum).Sum
        $memGB = [math]::Round($totalMem/1GB,2)
        Write-Host "  $($group.ToUpper().PadRight(15)) $($memGB.ToString().PadLeft(6)) GB ($($procs.Count) processos)"
    }
}
Write-Host ""

# Processos em Background (>100MB)
Write-Host "PROCESSOS EM BACKGROUND (>100MB):" -ForegroundColor Yellow
$bg = Get-Process | Where-Object { 
    $_.MainWindowTitle -eq "" -and 
    $_.WorkingSet64 -gt 100MB -and
    $_.ProcessName -notmatch "^(dwm|svchost|explorer|winlogon|csrss|lsass|services|System|Secure System)$"
} | Sort-Object WorkingSet64 -Descending

if($bg) {
    $bg | ForEach-Object {
        $memMB = [math]::Round($_.WorkingSet64/1MB,2)
        Write-Host "  $($_.ProcessName.PadRight(20)) $($memMB.ToString().PadLeft(8)) MB (PID: $($_.Id))"
    }
} else {
    Write-Host "  Nenhum processo significativo encontrado." -ForegroundColor Green
}
Write-Host ""

# Serviços Desnecessários
Write-Host "SERVIÇOS MANUAIS RODANDO (podem ser parados):" -ForegroundColor Yellow
$manual = Get-Service | Where-Object { 
    $_.Status -eq 'Running' -and 
    $_.StartType -eq 'Manual' -and
    $_.DisplayName -match "^(Xbox|Windows Search|Superfetch|SysMain|Remote Registry|Fax|Windows Media)"
} | Select-Object -First 10

if($manual) {
    $manual | ForEach-Object {
        Write-Host "  $($_.DisplayName)"
    }
} else {
    Write-Host "  Nenhum serviço desnecessário encontrado." -ForegroundColor Green
}
Write-Host ""

# Ações
Write-Host "=== AÇÕES ===" -ForegroundColor Cyan
Write-Host "1. Limpar memória e cache"
Write-Host "2. Parar processos em background (>100MB)"
Write-Host "3. Parar serviços desnecessários"
Write-Host "4. Fazer tudo acima"
Write-Host ""

$opcao = Read-Host "Escolha uma opção (1-4) ou Enter para sair"

if($opcao -eq "1" -or $opcao -eq "4") {
    Write-Host "`nLimpando memória..." -ForegroundColor Yellow
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()
    Remove-Item "$env:LOCALAPPDATA\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Concluído!" -ForegroundColor Green
}

if($opcao -eq "2" -or $opcao -eq "4") {
    Write-Host "`nParando processos em background..." -ForegroundColor Yellow
    $bg | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Parado: $($_.ProcessName)" -ForegroundColor Green
        } catch {
            Write-Host "  Não foi possível parar: $($_.ProcessName)" -ForegroundColor Red
        }
    }
}

if($opcao -eq "3" -or $opcao -eq "4") {
    Write-Host "`nParando serviços desnecessários..." -ForegroundColor Yellow
    $manual | ForEach-Object {
        try {
            Stop-Service -Name $_.Name -Force -ErrorAction SilentlyContinue
            Write-Host "  Parado: $($_.DisplayName)" -ForegroundColor Green
        } catch {
            Write-Host "  Não foi possível parar: $($_.DisplayName)" -ForegroundColor Red
        }
    }
}

if($opcao) {
    Start-Sleep -Seconds 2
    $memAfter = Get-CimInstance Win32_OperatingSystem
    $freeAfter = [math]::Round($memAfter.FreePhysicalMemory/1MB,2)
    $freed = $freeAfter - $free
    
    Write-Host "`n=== RESULTADO ===" -ForegroundColor Cyan
    Write-Host "Memória livre antes: $free GB" -ForegroundColor White
    Write-Host "Memória livre depois: $freeAfter GB" -ForegroundColor White
    if($freed -gt 0) {
        Write-Host "Memória liberada: $freed GB" -ForegroundColor Green
    }
}

Write-Host "`nConcluído!" -ForegroundColor Green

