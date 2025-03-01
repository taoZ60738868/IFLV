# IFLV (假驴子) - IPTV转发插件

<div align="center">
  <img src="assets/logo.png" alt="IFLV Logo" width="200"/>
  <h3>让IPTV不再受限，全家共享一个账号</h3>
</div>

## 项目简介

IFLV（假驴子）是一款运行在OpenWRT路由器上的智能IPTV转发插件，通过监听IPTV网口数据包并进行智能解析，模拟IPTV机顶盒将组播信号转为单播，从而实现家庭内网所有设备通过访问同一地址观看直播和回放。

> 项目背景：这是一位饱受电视会员困扰的产品经理，在与AI的激情碰撞后诞生的灵感产物。IFLV - "假驴子"，不仅解决了家庭多设备观看IPTV的痛点，还幽默地展示了技术如何为生活带来便利。

## 版本说明

**当前版本：1.0.0**

- 集成iStore一键安装功能
- 支持多平台部署（OpenWRT、iStore、爱快、小米路由器等）
- 提供全平台预编译IPK安装包
- 客户端下载服务更新，支持HTTPS访问
- 新增在线EPG节目源更新
- 架构优化，支持服务端、管理端、用户端、下载端分离

## 主要功能

- **智能组播转单播**：监听IPTV数据包并转换为内网可访问的单播信号
- **多模式支持**：支持双网线模式、VLAN模式和VLAN透传模式
- **EPG节目单管理**：自动获取、匹配和管理电视节目信息
- **友好的中文界面**：完全中文化的OpenWRT插件界面，简单易用
- **状态监控与诊断**：实时监控网络状态，智能诊断问题并提供解决方案
- **多平台支持**：兼容OpenWRT、iStore、爱快、小米路由器、群晖NAS和Docker
- **专属客户端**：提供安卓、Windows、Mac和iOS平台专用客户端，一键配置使用

## 一键安装

我们提供了简单的一键安装脚本，可以自动检测您的设备架构并安装相应版本：

```bash
wget -O /tmp/iflv_install.sh https://github.com/taoZ60738868/IFLV/raw/main/scripts/iflv_install.sh && chmod +x /tmp/iflv_install.sh && sh /tmp/iflv_install.sh
```

或者使用curl：

```bash
curl -o /tmp/iflv_install.sh https://github.com/taoZ60738868/IFLV/raw/main/scripts/iflv_install.sh && chmod +x /tmp/iflv_install.sh && sh /tmp/iflv_install.sh
```

## 手动安装方法

### OpenWRT/iStore
1. 下载适合您路由器架构的IPK包：[查看所有版本](https://github.com/taoZ60738868/IFLV/releases)
2. 打开路由器管理界面，进入软件包管理
3. 上传安装包或从在线软件源安装
4. 安装完成后，在"服务"菜单下找到"IFLV"

### 爱快/小米路由器
1. 下载适合您路由器架构的IPK包：[查看所有版本](https://github.com/taoZ60738868/IFLV/releases)
2. 登录管理界面，进入插件管理页面
3. 上传IFLV安装包并安装
4. 根据向导完成配置

### 群晖NAS
1. 在套件中心搜索并安装Docker（如未安装）
2. 添加IFLV Docker镜像
3. 配置网络设置并启动容器

### Docker安装
```bash
docker pull iflvteam/iflv:latest
docker run -d --network host --name iflv iflvteam/iflv:latest
```

## 支持的路由器架构

IFLV为以下常见路由器架构提供了预编译的IPK包：

- `arm_cortex-a7` (部分小米路由器、华为路由器等)
- `arm_cortex-a9` (部分网件、华硕高端路由器)
- `arm_cortex-a15` (部分高端路由器)
- `mipsel_24kc` (大多数入门级OpenWRT路由器)
- `mips_24kc` (部分老旧路由器)
- `x86_64` (X86软路由)
- `aarch64_cortex-a53` (树莓派、NanoPi等设备)

## 客户端下载

安装完成后，客户端可以通过以下方式获取：
1. 访问`http://[路由器IP]:8899`下载对应平台客户端
2. 或在IFLV管理界面的"系统设置"中获取下载链接

## 支持的平台

- **服务端**：OpenWRT、iStore、爱快路由器、小米路由器、群晖NAS、Docker
- **客户端**：Android、Windows、macOS、iOS (通过TestFlight或第三方播放器)

## 配置参考

### 基本配置
1. 进入IFLV管理界面，启用服务
2. 在"网口绑定"页面选择合适的工作模式
3. 配置对应的网口参数
4. 保存并应用配置

### 多终端使用
1. 服务端配置完成后，内网设备可通过`http://[路由器IP]:8899`下载客户端
2. 直接打开客户端，将自动连接到IFLV服务
3. 享受在任何设备上观看IPTV的便利

## 常见问题解答

### 安装后找不到界面入口？
检查是否已经安装luci-i18n-iflv-zh-cn语言包。如未安装，请运行：
```
opkg update
opkg install luci-i18n-iflv-zh-cn
```

### 下载服务无法启动？
检查端口8899是否被占用，可以在系统设置中修改下载服务端口。

### 客户端连接不上服务器？
确认路由器防火墙已放行8888端口(IPTV服务)和8899端口(下载服务)。

### 如何获取IPTV源？
IFLV会自动分析您的网络获取IPTV源，也可以手动导入m3u格式的播放列表。

### 支持哪些IPTV提供商？
目前支持中国电信、中国联通、中国移动等主流运营商的IPTV服务，以及其他符合标准协议的IPTV服务。

### 客户端在iOS上的安装方式？
由于App Store政策限制，iOS客户端需要通过TestFlight安装或使用第三方播放器播放IFLV提供的媒体流。

## 更新日志

### v1.0.0 (2024-03-01)
- 支持在线节目源与EPG更新
- 集成iStore一键安装功能
- 为所有支持的路由器架构提供预编译安装包
- 新增一键安装脚本
- 客户端下载服务支持HTTPS
- 优化多平台兼容性
- 修复已知问题，提升稳定性

### v0.2.0 (2024-02-15)
- 兼容iStore一键安装，提供平台自适应
- 针对6个平台进行优化，提供独立分支版本
- 新增客户端下载服务，支持多种终端设备
- 提供四端服务架构：服务端、管理端、用户端、下载端
- 专属客户端支持免配置使用和推送更新
- 修复已知问题，提升稳定性

## 贡献者

- 产品经理：被电视会员折磨的无奈灵魂
- 技术支持：AI助手
- 精神支持：家里的每一台想看IPTV的设备

## 许可证

本项目采用GNU通用公共许可证v3发布。

## 联系方式

如有任何问题或建议，欢迎通过以下方式联系我们：

- GitHub Issues: https://github.com/taoZ60738868/IFLV/issues
- 电子邮件: support@iflv.io
- 用户论坛: https://forum.iflv.io

感谢您选择IFLV，希望它能为您带来更自由的IPTV体验！ 