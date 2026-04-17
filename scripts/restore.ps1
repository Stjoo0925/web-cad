# restore.ps1
# Web CAD 스토리지 및 DB 복구 스크립트
# 사용법: .\restore.ps1 -BackupPath <path> [-StorageRoot <path>]

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    [string]$StorageRoot = $env:WEB_CAD_STORAGE_ROOT_HOST,
    [switch]$SkipDbRestore
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupPath)) {
    Write-Host "[오류] 백업 경로를 찾을 수 없습니다: $BackupPath" -ForegroundColor Red
    exit 1
}

Write-Host "=== Web CAD 복구 스크립트 ===" -ForegroundColor Cyan
Write-Host "백업 위치: $BackupPath"
Write-Host "스토리지 루트: $StorageRoot"

# 메타데이터 확인
$metaPath = Join-Path $BackupPath "metadata.json"
if (Test-Path $metaPath) {
    $metadata = Get-Content $metaPath -Raw | ConvertFrom-Json
    Write-Host "[정보] 백업 시간: $($metadata.backupTime)" -ForegroundColor White
    Write-Host "[정보] 원본 스토리지: $($metadata.storageRoot)" -ForegroundColor White
}

# 스토리지 복구
$storageBackupPath = Join-Path $BackupPath "storage"
if (Test-Path $storageBackupPath) {
    if ($StorageRoot) {
        Write-Host "[복구] 스토리지 데이터..." -ForegroundColor Yellow
        # 기존 데이터 백업 (안전을 위해)
        if (Test-Path $StorageRoot) {
            $archivePath = "$StorageRoot-archive-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Move-Item -Path $StorageRoot -Destination $archivePath -Force
            Write-Host "[보관] 기존 데이터: $archivePath" -ForegroundColor Orange
        }
        Copy-Item -Path $storageBackupPath -Destination $StorageRoot -Recurse -Force
        Write-Host "[완료] 스토리지 복구: $StorageRoot" -ForegroundColor Green
    }
} else {
    Write-Host "[경고] 스토리지 백업을 찾을 수 없습니다" -ForegroundColor Orange
}

# 데이터베이스 복구 ( PostgreSQL )
if (!$SkipDbRestore) {
    $dbBackupPath = Join-Path $BackupPath "database.sql"
    if (Test-Path $dbBackupPath) {
        Write-Host "[복구] 데이터베이스..." -ForegroundColor Yellow
        $psql = "psql"
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            & $psql -h ($env:WEB_CAD_DB_HOST -or "localhost") -p ($env:WEB_CAD_DB_PORT -or 5432) -U ($env:WEB_CAD_DB_USER -or "postgres") -d ($env:WEB_CAD_DB_NAME -or "webcad") -f $dbBackupPath 2>&1 | Out-Null
            Write-Host "[완료] DB 복구: $dbBackupPath" -ForegroundColor Green
        } else {
            Write-Host "[경고] psql을 찾을 수 없습니다. DB 복구를 건너뜁니다." -ForegroundColor Orange
        }
    }
} else {
    Write-Host "[건너뛰기] DB 복구 요청사항 없음" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== 복구 완료 ===" -ForegroundColor Cyan
Write-Host "백업 위치: $BackupPath"
Write-Host "스토리지 루트: $StorageRoot"
Write-Host ""

# 복구 검증
$itemCount = (Get-ChildItem $BackupPath -Recurse | Measure-Object).Count
Write-Host "복구된 항목 수: $itemCount" -ForegroundColor White

$size = (Get-ChildItem $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("복구 크기: {0:N2} MB" -f $size) -ForegroundColor White