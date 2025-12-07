# Script de Otimização de Memória
# Execute como Administrador para melhores resultados

Write-Host "=== OTIMIZAÇÃO DE MEMÓRIA ===" -ForegroundColor Cyan
Write-Host ""

# 1. Informações de Memória
$mem = Get-CimInstance Win32_OperatingSystem
$total = [math]::Round($mem.TotalVisibleMemorySize/1MB,2)
$free = [math]::Round($mem.FreePhysicalMemory/1MB,2)
$used = $total - $free
$percent = [math]::Round(($used/$total)*100,2)

Write-Host "=== STATUS ATUAL ===" -ForegroundColor Yellow
Write-Host "Total RAM: $total GB" -ForegroundColor White
Write-Host "Usado: $used GB ($percent%)" -ForegroundColor $(if($percent -gt 80){"Red"}elseif($percent -gt 60){"Yellow"}else{"Green"})
Write-Host "Livre: $free GB" -ForegroundColor Green
Write-Host ""

# 2. Top Processos Consumindo Memória
Write-Host "=== TOP 15 PROCESSOS (MEMÓRIA) ===" -ForegroundColor Yellow
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 15 | 
    ForEach-Object {
        $memMB = [math]::Round($_.WorkingSet64/1MB,2)
        $color = if($memMB -gt 500){"Red"}elseif($memMB -gt 200){"Yellow"}else{"White"}
        Write-Host "$($_.ProcessName.PadRight(25)) $($memMB.ToString().PadLeft(10)) MB (PID: $($_.Id))" -ForegroundColor $color
    }
Write-Host ""

# 3. Processos por Grupo
Write-Host "=== MEMÓRIA POR GRUPO DE PROCESSOS ===" -ForegroundColor Yellow
$groups = @("chrome", "cursor", "msedge", "firefox", "discord", "spotify", "steam")
foreach($group in $groups) {
    $procs = Get-Process -Name $group -ErrorAction SilentlyContinue
    if($procs) {
        $totalMem = ($procs | Measure-Object WorkingSet64 -Sum).Sum
        $memGB = [math]::Round($totalMem/1GB,2)
        Write-Host "$($group.ToUpper().PadRight(15)) $($memGB.ToString().PadLeft(6)) GB ($($procs.Count) processos)" -ForegroundColor White
    }
}
Write-Host ""

# 4. Processos em Background (sem janela)
Write-Host "=== PROCESSOS EM BACKGROUND (>50MB) ===" -ForegroundColor Yellow
$background = Get-Process | Where-Object { 
    $_.MainWindowTitle -eq "" -and 
    $_.WorkingSet64 -gt 50MB -and
    $_.ProcessName -notmatch "^(dwm|svchost|explorer|winlogon|csrss|lsass|services)$"
} | Sort-Object WorkingSet64 -Descending | Select-Object -First 10

if($background) {
    $background | ForEach-Object {
        $memMB = [math]::Round($_.WorkingSet64/1MB,2)
        Write-Host "$($_.ProcessName.PadRight(25)) $($memMB.ToString().PadLeft(10)) MB" -ForegroundColor White
    }
} else {
    Write-Host "Nenhum processo significativo encontrado." -ForegroundColor Green
}
Write-Host ""

# 5. Serviços Desnecessários (Manual)
Write-Host "=== SERVIÇOS MANUAIS RODANDO (POSSÍVEIS DE PARAR) ===" -ForegroundColor Yellow
$servicesToStop = @(
    "Xbox Live Auth Manager",
    "Xbox Game Monitoring",
    "Xbox Networking Service",
    "Windows Search",
    "Superfetch",
    "SysMain",
    "Remote Registry",
    "Fax",
    "Windows Media Player Network Sharing Service"
)

$runningManual = Get-Service | Where-Object { 
    $_.Status -eq 'Running' -and 
    $_.StartType -eq 'Manual' -and
    $_.DisplayName -in $servicesToStop
}

if($runningManual) {
    $runningManual | ForEach-Object {
        Write-Host "$($_.DisplayName)" -ForegroundColor White
    }
} else {
    Write-Host "Nenhum serviço desnecessário encontrado rodando." -ForegroundColor Green
}
Write-Host ""

# 6. Limpar Memória (Opcional)
Write-Host "=== AÇÕES DISPONÍVEIS ===" -ForegroundColor Cyan
Write-Host "1. Limpar memória de processos inativos" -ForegroundColor White
Write-Host "2. Parar serviços desnecessários" -ForegroundColor White
Write-Host "3. Limpar cache do sistema" -ForegroundColor White
Write-Host "4. Otimizar memória virtual" -ForegroundColor White
Write-Host ""

$action = Read-Host "Deseja executar otimizações? (S/N)"

if($action -eq "S" -or $action -eq "s") {
    Write-Host "`n=== EXECUTANDO OTIMIZAÇÕES ===" -ForegroundColor Green
    
    # Limpar memória de processos inativos
    Write-Host "Limpando memória..." -ForegroundColor Yellow
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()
    
    # Parar serviços desnecessários
    Write-Host "Parando serviços desnecessários..." -ForegroundColor Yellow
    $servicesToStop | ForEach-Object {
        $svc = Get-Service -Name $_ -ErrorAction SilentlyContinue
        if($svc -and $svc.Status -eq 'Running' -and $svc.StartType -eq 'Manual') {
            try {
                Stop-Service -Name $svc.Name -Force -ErrorAction SilentlyContinue
                Write-Host "  Parado: $_" -ForegroundColor Green
            } catch {
                Write-Host "  Não foi possível parar: $_" -ForegroundColor Red
            }
        }
    }
    
    # Limpar cache do Windows
    Write-Host "Limpando cache do sistema..." -ForegroundColor Yellow
    Remove-Item "$env:LOCALAPPDATA\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "`n=== OTIMIZAÇÃO CONCLUÍDA ===" -ForegroundColor Green
    
    # Verificar memória após otimização
    Start-Sleep -Seconds 2
    $memAfter = Get-CimInstance Win32_OperatingSystem
    $freeAfter = [math]::Round($memAfter.FreePhysicalMemory/1MB,2)
    $freed = $freeAfter - $free
    
    Write-Host "Memória livre antes: $free GB" -ForegroundColor White
    Write-Host "Memória livre depois: $freeAfter GB" -ForegroundColor White
    if($freed -gt 0) {
        Write-Host "Memória liberada: $freed GB" -ForegroundColor Green
    }
}

Write-Host "`n=== RELATÓRIO GERADO ===" -ForegroundColor Cyan
Write-Host "Execute 'Get-Content relatorio-memoria.txt' para ver o relatório completo." -ForegroundColor White
































