#!/usr/bin/env pwsh

# 创建packages目录结构
if (-not (Test-Path -Path "packages")) {
    New-Item -Path "packages" -ItemType Directory -Force
}

if (-not (Test-Path -Path "packages\1.1.0")) {
    New-Item -Path "packages\1.1.0" -ItemType Directory -Force
}

# 下载各架构安装包到临时目录
$tempDir = "temp_downloads"
if (-not (Test-Path -Path $tempDir)) {
    New-Item -Path $tempDir -ItemType Directory -Force
}

# 下载文件函数
function Download-File {
    param (
        [string]$Url,
        [string]$OutputPath
    )
    
    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath
        Write-Host "下载完成: $OutputPath" -ForegroundColor Green
    } catch {
        Write-Host "下载失败: $Url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 下载安装包
$files = @(
    "luci-app-iflv_1.1.0_x86_64.ipk",
    "luci-app-iflv_1.1.0_arm_cortex-a7.ipk",
    "luci-app-iflv_1.1.0_arm_cortex-a9.ipk",
    "luci-app-iflv_1.1.0_mipsel_24kc.ipk"
)

foreach ($file in $files) {
    $url = "https://iflv.io/download/$file"
    $outputPath = Join-Path -Path $tempDir -ChildPath $file
    Download-File -Url $url -OutputPath $outputPath
}

# 移动下载的文件到packages目录
if (Test-Path -Path $tempDir) {
    Move-Item -Path "$tempDir\*.ipk" -Destination "packages\1.1.0\" -Force
    Remove-Item -Path $tempDir -Recurse -Force
}

# 创建架构索引文件
$readmeContent = @"
# IFLV 1.1.0 安装包

本目录包含IFLV 1.1.0版本的安装包，适用于以下架构：

| 架构 | 文件名 |
|------|----------|
| x86_64 | luci-app-iflv_1.1.0_x86_64.ipk |
| arm_cortex-a7 | luci-app-iflv_1.1.0_arm_cortex-a7.ipk |
| arm_cortex-a9 | luci-app-iflv_1.1.0_arm_cortex-a9.ipk |
| mipsel_24kc | luci-app-iflv_1.1.0_mipsel_24kc.ipk |

## 安装说明

1. 下载适合您设备架构的安装包
2. 将文件上传到路由器的/tmp目录
3. 通过SSH登录路由器并执行：
   ```bash
   opkg update
   opkg install /tmp/luci-app-iflv_1.1.0_*.ipk
   ```

如需确定您的路由器架构，请在SSH中执行：
```bash
opkg print-architecture
```

详细安装指南见[安装文档](../../docs/installation.md)
"@

$readmeContent | Out-File -FilePath "packages\1.1.0\README.md" -Encoding utf8

# 创建packages目录索引
$packagesReadmeContent = @"
# IFLV 安装包

本目录包含IFLV各版本的安装包，按版本号组织。

## 可用版本

- [1.1.0](1.1.0) - 最新版本，支持多种架构
- [1.0.1](1.0.1) - 旧版本

## 版本说明

请参考[更新日志](../CHANGELOG.md)了解各版本的功能变更。
"@

$packagesReadmeContent | Out-File -FilePath "packages\README.md" -Encoding utf8

Write-Host "安装包目录设置完成!" -ForegroundColor Green 