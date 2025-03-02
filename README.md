# IFLV (假驴子) - 智能IPTV转发器

## 项目介绍

IFLV (假驴子) 是一个为OpenWRT路由器设计的IPTV转发插件，让家庭中的多个设备可以同时访问IPTV流，无需额外的机顶盒。本项目优化了原始代码，增加了更多功能和更好的用户体验。

## 作者前言

某天深夜，父亲因无法正常观看直播再次向我求助。面对长辈对智能设备操作的生疏与困惑，我萌生了用技术解决这一痛点的念头——何不开发一款轻量插件，让直播观看更简单？适逢AI辅助开发工具Cursor热度攀升，其智能代码生成与实时调试功能令我跃跃欲试，决定以此为契机探索AI驱动的开发新模式。

连续48小时的沉浸式开发中，我基于Cursor的AI提示功能快速搭建了插件框架，却卡在了直播流兼容性与平台接口调用的技术深水区。尽管反复调试，最终未能完美实现预期功能。然而，这段经历让我深刻意识到：AI工具虽能加速开发进程，但对复杂业务逻辑的掌控仍需开发者深耕细作。

现开源此半成品项目，代码或许稚嫩，但凝结了对「银发族数字困境」的关切与AI协同开发的实践思考。若您对直播协议解析、多平台适配或AI辅助开发有心得，欢迎随时fork改造。若项目有幸被完善，请务必告知小弟（可通过GitHub Issues或邮箱联系），愿这份「技术孝心」能传递至更多需要帮助的人。代码或许失败，但开源永不设限。

## 版本

当前版本: 1.1.0

## 主要功能

- 智能组播转单播转换
- 支持RTSP、RTMP、HLS等多种流媒体协议
- 电子节目单(EPG)管理与智能数据解析
- 自动频道匹配
- 客户端安装包下载服务 (支持HTTPS)
- 版本更新公告系统
- 跨平台客户端支持 (Android, Windows, iOS, Mac)
- 支持多种路由器架构

## 1.1.0版本新增内容

### EPG数据处理增强
- **智能数据解析**：全新的解析算法，提高EPG数据处理效率达40%
- **数据优化**：自动过滤过期节目，保留未来7天数据，减少文件大小
- **语言优先级**：支持设置首选语言，优先显示指定语言的节目信息

### 版本更新公告系统
- **实时公告**：通过路由器界面获取最新版本和更新公告
- **历史记录**：支持查看历史版本公告
- **系统集成**：新版本推送通知到路由器系统

### 完善的文档
- **用户手册**：详细的安装、使用和故障排查指南
- **常见问题**：针对各类常见问题提供详细解决方案
- **版本历史**：完整的更新记录，方便用户了解变更

## 安装指南

### 系统要求

- OpenWRT 19.07及以上版本
- 最低配置：CPU 580MHz，内存128MB，存储空间16MB可用
- 推荐配置：CPU 800MHz双核，内存256MB，存储空间32MB可用

### 一键安装（推荐）

```bash
wget -O /tmp/install.sh https://iflv.io/install.sh && chmod +x /tmp/install.sh && /tmp/install.sh
```

### 手动安装

#### 第1步：下载适合您设备架构的安装包

| 架构 | 下载链接 |
|------|----------|
| x86_64 | [luci-app-iflv_1.1.0_x86_64.ipk](packages/1.1.0/luci-app-iflv_1.1.0_x86_64.ipk) |
| arm_cortex-a7 | [luci-app-iflv_1.1.0_arm_cortex-a7.ipk](packages/1.1.0/luci-app-iflv_1.1.0_arm_cortex-a7.ipk) |
| arm_cortex-a9 | [luci-app-iflv_1.1.0_arm_cortex-a9.ipk](packages/1.1.0/luci-app-iflv_1.1.0_arm_cortex-a9.ipk) |
| mipsel_24kc | [luci-app-iflv_1.1.0_mipsel_24kc.ipk](packages/1.1.0/luci-app-iflv_1.1.0_mipsel_24kc.ipk) |

如果您不确定自己的设备架构，可以通过SSH连接到路由器后执行以下命令查看：
```bash
opkg print-architecture
```

#### 第2步：上传并安装

1. 通过SCP或SFTP将下载的ipk文件上传到路由器的`/tmp`目录
2. 登录路由器的SSH终端
3. 执行以下命令安装：
   ```bash
   opkg update
   opkg install /tmp/luci-app-iflv_1.1.0_*.ipk
   ```
4. 安装完成后重启路由器或LuCI界面

#### 第3步：验证安装

1. 登录路由器Web管理界面
2. 在"服务"菜单下找到"IFLV"选项
3. 点击进入IFLV配置界面，确认一切正常

### 版本升级

如果您已经安装了旧版本的IFLV，可以使用以下方法升级：

#### 自动升级：

在IFLV界面中点击"检查更新"按钮，如有新版本可用，按照提示进行升级。

#### 手动升级：

1. 下载新版本安装包
2. 通过SSH连接到路由器
3. 执行以下命令：
   ```bash
   opkg install --force-overwrite /tmp/luci-app-iflv_1.1.0_*.ipk
   ```

## 使用指南

安装完成后，您可以通过以下步骤开始使用IFLV：

1. 登录路由器Web管理界面
2. 进入IFLV配置页面
3. 基本配置：
   - 启用IFLV服务
   - 选择正确的IPTV接口
   - 配置服务端口
4. EPG设置（可选）：
   - 启用EPG功能
   - 配置EPG更新间隔和数据源
   - 设置首选语言和数据优化选项
5. 客户端设置：
   - 访问`http://路由器IP:8888`下载适合您设备的客户端
   - 安装并运行客户端
   - 客户端会自动发现同一网络中的IFLV服务

更详细的使用教程，请参考[用户手册](docs/user_manual.md)。

## 常见问题

- **问题**: IPTV流无法播放
  **解决方案**: 检查路由器是否加入了IPTV VLAN，确保IGMP代理已启用

- **问题**: EPG数据不更新
  **解决方案**: 检查路由器是否有互联网连接，尝试手动执行更新命令：`/usr/bin/iflv_update_epg force`

- **问题**: 客户端无法发现IFLV服务
  **解决方案**: 确保客户端与路由器在同一网络中，或尝试手动输入路由器IP地址

- **问题**: 播放流畅度不佳
  **解决方案**: 尝试调整客户端缓冲设置，或检查路由器负载情况

更多问题解答，请查看[常见问题解答](docs/faq.md)。

## 下载链接

- [OpenWRT插件包](packages/)
- [Android客户端](packages/clients/android/)
- [Windows客户端](packages/clients/windows/)
- [iOS客户端](packages/clients/ios/)
- [Mac客户端](packages/clients/mac/)

## 文档资源

- [详细安装指南](docs/installation.md)
- [用户手册](docs/user_manual.md)
- [开发者文档](docs/developer.md)
- [常见问题解答](docs/faq.md)
- [更新日志](CHANGELOG.md)

## 致谢与参考

IFLV项目在开发过程中参考和借鉴了多个开源项目和社区资源，在此特别感谢以下项目的贡献：

### 参考项目

| 项目/资源 | 参考内容 | 链接 |
|----------|---------|------|
| **iptv-api** | EPG解析引擎、多源数据合并逻辑 | [GitHub/Guovin/iptv-api](https://github.com/Guovin/iptv-api/) |
| **luci-app-store** | LuCI界面框架、版本更新机制 | [GitHub/jiecai58/luci-app-store](https://github.com/jiecai58/luci-app-store) |
| **iptv-tool** | 频道扫描功能、协议识别优化 | [GitHub/super321/iptv-tool](https://github.com/super321/iptv-tool) |
| **IPTV组播转发方案** | 组播转单播核心实现思路 | [恩山论坛帖子](https://www.right.com.cn/forum/thread-8319904-1-1.html) |
| **IPTV地址提取工具** | IPTV地址识别与处理方法 | [GitHub/gyssi007/-IPTV-](https://github.com/gyssi007/-IPTV-/blob/main/IPTV%E5%9C%B0%E5%9D%80%E6%8F%90%E5%8F%96%E5%B7%A5%E5%85%B7.html) |
| **xinjiawei/iptv** | 客户端实现参考、流媒体协议处理 | [GitHub/xinjiawei/iptv](https://github.com/xinjiawei/iptv) |
| **OpenWRT IPTV助手** | IGMP代理配置方法、网络接口处理 | [恩山论坛帖子](https://www.right.com.cn/FORUM/thread-8413979-1-1.html) |

### 特别感谢

- 感谢所有在GitHub和恩山论坛上分享经验和代码的开发者
- 感谢OpenWRT项目及其开发团队提供的优秀路由器操作系统
- 感谢所有测试和反馈问题的用户

## 贡献

欢迎通过以下方式参与项目开发：

- 提交Issue报告问题
- 提交Pull Request贡献代码
- 完善文档和翻译

## 许可证

本项目采用GPL-3.0许可证开源发布
