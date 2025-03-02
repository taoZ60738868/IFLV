# IFLV安装指南

本文档提供IFLV (假驴子) 的详细安装指南，包括不同安装方法和各种路由器架构的特殊说明。

## 目录

- [安装前准备](#安装前准备)
- [安装方法](#安装方法)
  - [一键安装](#一键安装)
  - [手动安装](#手动安装)
  - [离线安装](#离线安装)
- [不同架构安装说明](#不同架构安装说明)
- [安装后配置](#安装后配置)
- [版本升级](#版本升级)
- [故障排除](#故障排除)

## 安装前准备

在安装IFLV之前，请确保您的系统满足以下要求：

### 系统要求

- **操作系统**: OpenWRT 19.07及以上版本（推荐21.02或更高版本）
- **最低硬件配置**:
  - CPU: 单核580MHz及以上
  - 内存: 128MB及以上
  - 存储空间: 16MB可用空间
- **网络要求**:
  - 已配置并能正常访问互联网的路由器
  - 可以接收IPTV信号的网络接口

### 准备步骤

1. **确认路由器型号和架构**:
   
   通过SSH连接到路由器并执行以下命令：
   ```bash
   opkg print-architecture
   ```
   
   记录输出的架构信息，通常会显示类似以下内容之一：
   - x86_64
   - arm_cortex-a7_neon-vfpv4
   - mipsel_24kc
   - ...

2. **检查存储空间**:
   ```bash
   df -h
   ```
   确保`/overlay`或`/`分区有至少16MB可用空间。

3. **备份当前配置**（可选但推荐）:
   ```bash
   sysupgrade -b /tmp/backup_before_iflv.tar.gz
   ```

## 安装方法

### 一键安装

一键安装是最简单的方法，适合大多数用户：

1. **连接到路由器**：
   通过SSH连接到路由器。Windows用户可使用PuTTY，Linux/Mac用户可以直接使用终端。
   ```bash
   ssh root@192.168.1.1
   ```

2. **执行安装命令**：
   ```bash
   wget -O /tmp/install.sh https://iflv.io/install.sh && chmod +x /tmp/install.sh && /tmp/install.sh
   ```

3. **等待安装完成**：
   安装脚本会自动检测您的系统架构，下载并安装适合的IFLV版本。整个过程需要2-5分钟，取决于您的网络速度。

4. **安装验证**：
   安装成功后，您可以在LuCI界面的"服务"菜单中找到"IFLV"选项。

### 手动安装

如果您想要更精细地控制安装过程，或者一键安装出现问题，可以采用手动安装：

1. **确定路由器架构并下载对应安装包**：
   
   访问[IFLV下载页面](https://iflv.io/download/)，选择与您路由器架构匹配的安装包。
   
   常见架构对应的软件包：
   - x86_64: [luci-app-iflv_1.1.0_x86_64.ipk](https://iflv.io/download/luci-app-iflv_1.1.0_x86_64.ipk)
   - arm_cortex-a7: [luci-app-iflv_1.1.0_arm_cortex-a7.ipk](https://iflv.io/download/luci-app-iflv_1.1.0_arm_cortex-a7.ipk)
   - mipsel_24kc: [luci-app-iflv_1.1.0_mipsel_24kc.ipk](https://iflv.io/download/luci-app-iflv_1.1.0_mipsel_24kc.ipk)

2. **将安装包上传到路由器**：
   
   方法一：通过SCP上传（推荐）
   ```bash
   scp luci-app-iflv_1.1.0_*.ipk root@192.168.1.1:/tmp/
   ```
   
   方法二：通过路由器Web界面上传
   - 登录路由器管理界面
   - 进入"系统"->"文件传输"
   - 选择文件并上传到"/tmp"目录

3. **通过SSH连接到路由器并安装**：
   ```bash
   opkg update
   opkg install /tmp/luci-app-iflv_1.1.0_*.ipk
   ```

4. **安装依赖（如有提示）**：
   如果安装过程中提示缺少依赖，请按照错误信息安装相应的依赖包：
   ```bash
   opkg install <依赖包名称>
   ```

5. **重启LuCI**：
   ```bash
   /etc/init.d/uhttpd restart
   ```

### 离线安装

如果您的路由器无法直接访问互联网，可以采用离线安装方法：

1. **准备安装包和依赖**：
   
   在能够访问互联网的电脑上，下载以下文件：
   - 适合您路由器架构的IFLV安装包
   - 常见依赖包：
     - luci-base
     - luci-compat
     - libuci
     - kmod-ipt-nat
     - kmod-nf-nathelper
     - libiwinfo
   
   您可以从[OpenWRT软件包网站](https://downloads.openwrt.org/releases/)下载这些依赖包。

2. **将所有安装包上传到路由器**：
   ```bash
   scp *.ipk root@192.168.1.1:/tmp/
   ```

3. **安装依赖和IFLV**：
   ```bash
   cd /tmp
   opkg install *.ipk
   ```

4. **验证安装**：
   重启LuCI并检查IFLV服务是否出现在服务列表中。

## 不同架构安装说明

### 小米路由器（mipsel_24kc）

小米路由器需要特别注意以下几点：

1. **确认SSH访问**：
   部分小米路由器需要先开启SSH访问，请参考[小米官方文档](https://www.mi.com/service/bijiben/index-13.html)。

2. **特殊安装步骤**：
   ```bash
   opkg update
   opkg install libustream-openssl
   opkg install /tmp/luci-app-iflv_1.1.0_mipsel_24kc.ipk
   ```

3. **解决内存问题**（对于内存较小的型号）：
   ```bash
   # 添加swap分区以增加虚拟内存
   opkg update && opkg install swap-utils
   dd if=/dev/zero of=/swapfile bs=1M count=64
   mkswap /swapfile
   swapon /swapfile
   echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
   ```

### 红米AC2100（arm_cortex-a7）

1. **固件选择**：
   推荐使用[OpenWRT官方固件](https://firmware-selector.openwrt.org/)。

2. **安装步骤**：
   ```bash
   opkg update
   opkg install /tmp/luci-app-iflv_1.1.0_arm_cortex-a7.ipk
   ```

3. **优化设置**：
   AC2100性能较好，可以启用全部IFLV功能，包括HTTPS支持。

### X86软路由（x86_64）

1. **内核模块**：
   确保已安装必要的内核模块：
   ```bash
   opkg update
   opkg install kmod-nf-nathelper-extra
   ```

2. **安装IFLV**：
   ```bash
   opkg install /tmp/luci-app-iflv_1.1.0_x86_64.ipk
   ```

3. **性能建议**：
   X86平台性能通常较好，可以启用所有高级功能并同时支持多个客户端连接。

## 安装后配置

安装完成后，按照以下步骤进行初始设置：

1. **访问IFLV配置界面**：
   - 登录路由器Web管理界面
   - 在"服务"菜单中找到并点击"IFLV"

2. **基本设置**：
   - 启用IFLV服务
   - 选择IPTV接口（通常是WAN口或连接IPTV信号的接口）
   - 设置服务端口（默认8888）
   - 设置日志级别

3. **EPG设置**（可选）：
   - 启用EPG功能
   - 配置EPG数据源
   - 设置更新间隔

4. **保存并应用设置**：
   点击"保存并应用"按钮，等待服务启动。

5. **验证服务状态**：
   - 在服务状态页面确认IFLV正在运行
   - 或通过SSH执行命令检查状态：
     ```bash
     /etc/init.d/iflv status
     ```

## 版本升级

当有新版本发布时，您可以使用以下方法升级IFLV：

### 自动升级

1. **Web界面升级**：
   - 进入IFLV配置界面
   - 点击"关于"选项卡
   - 点击"检查更新"按钮
   - 如有更新，按照提示进行升级

### 手动升级

1. **下载新版本安装包**

2. **上传到路由器并安装**：
   ```bash
   # 先停止服务
   /etc/init.d/iflv stop
   
   # 安装新版本（使用force-overwrite选项覆盖现有文件）
   opkg install --force-overwrite /tmp/luci-app-iflv_新版本号_*.ipk
   
   # 重启服务
   /etc/init.d/iflv start
   ```

3. **验证升级**：
   检查版本号是否已更新：
   ```bash
   /usr/bin/iflv version
   ```

## 故障排除

### 安装错误

1. **找不到安装包**：
   ```
   opkg: Cannot find package luci-app-iflv_*.ipk
   ```
   
   **解决方案**：
   - 确认安装包路径是否正确
   - 使用绝对路径：`opkg install /tmp/luci-app-iflv_1.1.0_*.ipk`

2. **架构不匹配**：
   ```
   Collected errors:
   * pkg_check_arch: Package luci-app-iflv_1.1.0_x86_64.ipk not compatible with arm_cortex-a7
   ```
   
   **解决方案**：
   - 确认您的架构：`opkg print-architecture`
   - 下载正确架构的安装包

3. **依赖问题**：
   ```
   Collected errors:
   * satisfy_dependencies_for: Cannot satisfy the following dependencies for luci-app-iflv:*
   ```
   
   **解决方案**：
   - 安装缺失的依赖：`opkg install <依赖包名称>`
   - 确保已执行`opkg update`更新软件源

### 安装后问题

1. **服务无法启动**：
   ```
   service iflv is not running
   ```
   
   **解决方案**：
   - 检查错误日志：`cat /var/log/iflv.log`
   - 手动启动并观察错误：`/etc/init.d/iflv start`
   - 检查是否有端口冲突：`netstat -lntp | grep 8888`

2. **Web界面无法访问**：
   
   **解决方案**：
   - 清理LuCI缓存：`rm -rf /tmp/luci-*`
   - 重启uhttpd：`/etc/init.d/uhttpd restart`
   - 检查权限：`chmod +x /usr/lib/lua/luci/controller/iflv.lua`

3. **空间不足**：
   ```
   No space left on device
   ```
   
   **解决方案**：
   - 清理临时文件：`rm -rf /tmp/*`
   - 删除不必要的软件包：`opkg remove <不需要的包名>`
   - 查找大文件：`find / -type f -size +1000k | sort -nr -k5 | head -10`

如果您遇到的问题无法通过上述方法解决，请参考[常见问题解答](faq.md)或在[GitHub仓库](https://github.com/username/luci-app-iflv)提交Issue。 