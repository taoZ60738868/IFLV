#!/usr/bin/env powershell

# IFLV简化发布脚本

Write-Host "====== IFLV 1.1.0 发布准备 ======" -ForegroundColor Cyan

# 检查目录结构
$requiredDirs = @(
    "packages/1.1.0",
    "packages/clients/android",
    "packages/clients/windows",
    "packages/clients/ios",
    "packages/clients/mac",
    "docs"
)

foreach ($dir in $requiredDirs) {
    if (-not (Test-Path -Path $dir)) {
        Write-Host "创建目录: $dir" -ForegroundColor Yellow
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# 创建标签
Write-Host "是否为v1.1.0创建标签？(y/n)" -ForegroundColor Cyan
$createTag = Read-Host

if ($createTag -eq "y") {
    git tag -a v1.1.0 -m "IFLV 1.1.0版本发布"
    git push origin v1.1.0
    Write-Host "成功创建并推送标签v1.1.0" -ForegroundColor Green
}

Write-Host "====== 发布准备完成 ======" -ForegroundColor Cyan
Write-Host "请登录GitHub创建新的Release，选择v1.1.0标签，并上传安装包文件。" -ForegroundColor Green 