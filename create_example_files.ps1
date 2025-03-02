#!/usr/bin/env powershell

# 创建packages目录结构
if (-not (Test-Path -Path "packages")) {
    New-Item -Path "packages" -ItemType Directory -Force
}

if (-not (Test-Path -Path "packages\1.1.0")) {
    New-Item -Path "packages\1.1.0" -ItemType Directory -Force
}

# 创建示例安装包文件（空文件，仅用于演示）
$files = @(
    "luci-app-iflv_1.1.0_x86_64.ipk",
    "luci-app-iflv_1.1.0_arm_cortex-a7.ipk",
    "luci-app-iflv_1.1.0_arm_cortex-a9.ipk",
    "luci-app-iflv_1.1.0_mipsel_24kc.ipk"
)

foreach ($file in $files) {
    $outputPath = Join-Path -Path "packages\1.1.0" -ChildPath $file
    New-Item -Path $outputPath -ItemType File -Force | Out-Null
    Write-Host "创建示例文件: $outputPath" -ForegroundColor Green
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