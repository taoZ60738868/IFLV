#!/usr/bin/env powershell

# IFLV发布脚本
# 用于准备发布到GitHub的文件

Write-Host "====== IFLV 1.1.0 发布准备 ======" -ForegroundColor Cyan

# 检查是否有未提交的更改
$changes = git status --porcelain
if ($changes) {
    Write-Host "存在未提交的更改:" -ForegroundColor Yellow
    git status
    
    $confirm = Read-Host "是否继续提交这些更改？(y/n)"
    if ($confirm -ne "y") {
        Write-Host "操作已取消。请先提交或存储您的更改。" -ForegroundColor Red
        exit 1
    }
    
    # 添加所有更改
    git add --all
    git commit -m "IFLV 1.1.0发布准备：整理文件结构和文档"
}

# 检查主程序版本号
$mainScript = Get-Content -Path "luci-app-iflv/root/usr/bin/iflv" -Raw
if ($mainScript -match 'VERSION="([^"]+)"') {
    $version = $matches[1]
    Write-Host "当前主程序版本: $version" -ForegroundColor Green
    
    if ($version -ne "1.1.0") {
        Write-Host "警告: 主程序版本不是1.1.0，是否需要更新？" -ForegroundColor Yellow
        $updateVersion = Read-Host "是否更新版本号为1.1.0？(y/n)"
        
        if ($updateVersion -eq "y") {
            $mainScript = $mainScript -replace 'VERSION="[^"]+"', 'VERSION="1.1.0"'
            $mainScript | Set-Content -Path "luci-app-iflv/root/usr/bin/iflv" -NoNewline
            git add "luci-app-iflv/root/usr/bin/iflv"
            git commit -m "更新主程序版本号至1.1.0"
        }
    }
}

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

# 确认README.md中的下载链接已更新
$readme = Get-Content -Path "README.md" -Raw
if ($readme -match "https://iflv.io/download/") {
    Write-Host "警告: README.md中仍然存在外部下载链接，建议更新为本地链接" -ForegroundColor Yellow
    $updateReadme = Read-Host "是否自动更新链接？(y/n)"
    
    if ($updateReadme -eq "y") {
        $readme = $readme -replace "https://iflv.io/download/luci-app-iflv_1.1.0_x86_64.ipk", "packages/1.1.0/luci-app-iflv_1.1.0_x86_64.ipk"
        $readme = $readme -replace "https://iflv.io/download/luci-app-iflv_1.1.0_arm_cortex-a7.ipk", "packages/1.1.0/luci-app-iflv_1.1.0_arm_cortex-a7.ipk"
        $readme = $readme -replace "https://iflv.io/download/luci-app-iflv_1.1.0_arm_cortex-a9.ipk", "packages/1.1.0/luci-app-iflv_1.1.0_arm_cortex-a9.ipk"
        $readme = $readme -replace "https://iflv.io/download/luci-app-iflv_1.1.0_mipsel_24kc.ipk", "packages/1.1.0/luci-app-iflv_1.1.0_mipsel_24kc.ipk"
        $readme = $readme -replace "https://iflv.io/download/", "packages/"
        $readme | Set-Content -Path "README.md" -NoNewline
        git add "README.md"
        git commit -m "更新README.md中的下载链接为本地路径"
    }
}

# 推送更改到远程仓库
Write-Host "是否推送更改到远程仓库？" -ForegroundColor Cyan
$pushChanges = Read-Host "(y/n)"

if ($pushChanges -eq "y") {
    git push origin main
    
    # 创建和推送标签
    Write-Host "是否为v1.1.0创建标签？" -ForegroundColor Cyan
    $createTag = Read-Host "(y/n)"
    
    if ($createTag -eq "y") {
        git tag -a v1.1.0 -m "IFLV 1.1.0版本发布"
        git push origin v1.1.0
        Write-Host "成功创建并推送标签v1.1.0" -ForegroundColor Green
    }
}

Write-Host "====== 发布准备完成 ======" -ForegroundColor Cyan
Write-Host "请登录GitHub创建新的Release，选择v1.1.0标签，并上传安装包文件。" -ForegroundColor Green