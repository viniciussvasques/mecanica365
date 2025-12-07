# Script para Mapear Todos os Processos e Serviços
# Gera relatório detalhado

$report = @"
========================================
RELATÓRIO COMPLETO DE PROCESSOS E MEMÓRIA
Gerado em: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
========================================

"@

# 1. Informações do Sistema
$mem = Get-CimInstance Win32_OperatingSystem
$total = [math]::Round($mem.TotalVisibleMemorySize/1MB,2)
$free = [math]::Round($mem.FreePhysicalMemory/1MB,2)
$used = $total - $free
$percent = [math]::Round(($used/$total)*100,2)

$report += @"

=== INFORMAÇÕES DO SISTEMA ===
Total de RAM: $total GB
RAM Usada: $used GB ($percent%)
RAM Livre: $free GB

"@

# 2. Todos os Processos (ordenados por memória)
$report += @"

=== TODOS OS PROCESSOS (ordenados por memória) ===
"@

$processes = Get-Process | Sort-Object WorkingSet64 -Descending
$totalProcessMem = 0

foreach($proc in $processes) {
    $memMB = [math]::Round($proc.WorkingSet64/1MB,2)
    $cpu = [math]::Round($proc.CPU,2)
    $totalProcessMem += $proc.WorkingSet64
    $report += "{0,-30} {1,10} MB | CPU: {2,8} s | PID: {3}`n" -f $proc.ProcessName, $memMB, $cpu, $proc.Id
}

$report += @"

Total de processos: $($processes.Count)
Memória total dos processos: $([math]::Round($totalProcessMem/1GB,2)) GB

"@

# 3. Processos Agrupados
$report += @"

=== PROCESSOS AGRUPADOS POR NOME ===
"@

$grouped = Get-Process | Group-Object ProcessName | Sort-Object @{Expression={($_.Group | Measure-Object WorkingSet64 -Sum).Sum}} -Descending

foreach($group in $grouped) {
    $totalMem = ($group.Group | Measure-Object WorkingSet64 -Sum).Sum
    $memGB = [math]::Round($totalMem/1GB,2)
    $memMB = [math]::Round($totalMem/1MB,2)
    $count = $group.Count
    $report += "{0,-30} {1,8} MB ({2,5} GB) | {3} instância(s)`n" -f $group.Name, $memMB, $memGB, $count
}

# 4. Processos em Background
$report += @"

=== PROCESSOS EM BACKGROUND (sem janela, >50MB) ===
"@

$background = Get-Process | Where-Object { 
    $_.MainWindowTitle -eq "" -and 
    $_.WorkingSet64 -gt 50MB -and
    $_.ProcessName -notmatch "^(dwm|svchost|explorer|winlogon|csrss|lsass|services|System)$"
} | Sort-Object WorkingSet64 -Descending

if($background) {
    foreach($proc in $background) {
        $memMB = [math]::Round($proc.WorkingSet64/1MB,2)
        $report += "{0,-30} {1,10} MB | PID: {2}`n" -f $proc.ProcessName, $memMB, $proc.Id
    }
} else {
    $report += "Nenhum processo significativo encontrado.`n"
}

# 5. Serviços Rodando
$report += @"

=== SERVIÇOS RODANDO ===
"@

$services = Get-Service | Where-Object { $_.Status -eq 'Running' } | Sort-Object DisplayName
foreach($svc in $services) {
    $report += "{0,-50} {1,-10} {2}`n" -f $svc.DisplayName, $svc.Status, $svc.StartType
}

# 6. Serviços que podem ser parados
$report += @"

=== SERVIÇOS MANUAIS RODANDO (podem ser parados) ===
"@

$manualServices = Get-Service | Where-Object { 
    $_.Status -eq 'Running' -and 
    $_.StartType -eq 'Manual'
} | Sort-Object DisplayName

foreach($svc in $manualServices) {
    $report += "{0}`n" -f $svc.DisplayName
}

# 7. Processos de Desenvolvimento
$report += @"

=== PROCESSOS DE DESENVOLVIMENTO ===
"@

$devProcesses = Get-Process | Where-Object { 
    $_.ProcessName -match "^(node|npm|yarn|pnpm|docker|code|cursor|vscode|git|java|python|dotnet)$"
} | Sort-Object WorkingSet64 -Descending

if($devProcesses) {
    foreach($proc in $devProcesses) {
        $memMB = [math]::Round($proc.WorkingSet64/1MB,2)
        $report += "{0,-30} {1,10} MB | PID: {2}`n" -f $proc.ProcessName, $memMB, $proc.Id
    }
} else {
    $report += "Nenhum processo de desenvolvimento encontrado.`n"
}

# 8. Recomendações
$report += @"

=== RECOMENDAÇÕES ===
"@

# Verificar Chrome
$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue
if($chromeProcs) {
    $chromeMem = ($chromeProcs | Measure-Object WorkingSet64 -Sum).Sum
    $chromeGB = [math]::Round($chromeMem/1GB,2)
    if($chromeGB -gt 1) {
        $report += "- Chrome está usando $chromeGB GB. Considere fechar abas não utilizadas.`n"
    }
}

# Verificar Cursor
$cursorProcs = Get-Process cursor -ErrorAction SilentlyContinue
if($cursorProcs) {
    $cursorMem = ($cursorProcs | Measure-Object WorkingSet64 -Sum).Sum
    $cursorGB = [math]::Round($cursorMem/1GB,2)
    if($cursorGB -gt 2) {
        $report += "- Cursor está usando $cursorGB GB. Considere fechar projetos não utilizados.`n"
    }
}

# Verificar memória livre
if($free -lt 2) {
    $report += "- Memória livre está baixa ($free GB). Considere fechar aplicações não utilizadas.`n"
}

$report += @"

=== FIM DO RELATÓRIO ===
"@

# Salvar relatório
$report | Out-File -FilePath "relatorio-memoria.txt" -Encoding UTF8

Write-Host "Relatório gerado: relatorio-memoria.txt" -ForegroundColor Green
Write-Host "Total de processos: $($processes.Count)" -ForegroundColor White
Write-Host "Memória total usada pelos processos: $([math]::Round($totalProcessMem/1GB,2)) GB" -ForegroundColor White






























