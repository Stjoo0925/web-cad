# backup.ps1
# Web CAD 스토리지 및 DB 백업 스크립트
# 사용법: .\backup.ps1 [-BackupPath <path>] [-StorageRoot <path>]

param(
    [string]$BackupPath = ".\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')",
    [string]$StorageRoot = $env:WEB_CAD_STORAGE_ROOT_HOST
)

$ErrorActionPreference = "Stop"

Write-Host "=== Web CAD 백업 스크립트 ===" -ForegroundColor Cyan
Write-Host "백업 위치: $BackupPath"
Write-Host "스토리지 루트: $StorageRoot"

# 백업 디렉토리 생성
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "[생성] 백업 디렉토리: $BackupPath" -ForegroundColor Green
}

# 스토리지 백업
$storageBackupPath = Join-Path $BackupPath "storage"
if ($StorageRoot -and (Test-Path $StorageRoot)) {
    Write-Host "[백업] 스토리지 데이터..." -ForegroundColor Yellow
    Copy-Item -Path $StorageRoot -Destination $storageBackupPath -Recurse -Force
    Write-Host "[완료] 스토리지 백업: $storageBackupPath" -ForegroundColor Green
} else {
    Write-Host "[경고] 스토리지 루트를 찾을 수 없습니다: $StorageRoot" -ForegroundColor Orange
}

# 데이터베이스 백업 ( PostgreSQL )
$dbBackupPath = Join-Path $BackupPath "database.sql"
if ($env:WEB_CAD_DB_HOST) {
    Write-Host "[백업] 데이터베이스..." -ForegroundColor Yellow
    $pgDump = "pg_dump"
    if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
        & $pgDump -h $env:WEB_CAD_DB_HOST -p ($env:WEB_CAD_DB_PORT -or 5432) -U ($env:WEB_CAD_DB_USER -or "postgres") -d ($env:WEB_CAD_DB_NAME -or "webcad") -f $dbBackupPath 2>&1 | Out-Null
        Write-Host "[완료] DB 백업: $dbBackupPath" -ForegroundColor Green
    } else {
        Write-Host "[경고] pg_dump를 찾을 수 없습니다. DB 백업을 건너뜁니다." -ForegroundColor Orange
    }
}

# 메타데이터 백업 (JSON)
$metaPath = Join-Path $BackupPath "metadata.json"
$metadata = @{
    backupTime = (Get-Date).ToString("o")
    storageRoot = $StorageRoot
    dbHost = $env:WEB_CAD_DB_HOST
    version = "1.0.0"
}
$metadata | ConvertTo-Json -Depth 3 | Set-Content $metaPath -Encoding UTF8
Write-Host "[완료] 메타데이터: $metaPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== 백업 완료 ===" -ForegroundColor Cyan
Write-Host "백업 위치: $BackupPath"
Write-Host ""

# 백업 검증
$itemCount = (Get-ChildItem $BackupPath -Recurse | Measure-Object).Count
Write-Host "백업 항목 수: $itemCount" -ForegroundColor White

# 완료 후 크기 출력
$size = (Get-ChildItem $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("백업 크기: {0:N2} MB" -f $size) -ForegroundColor White