#!/bin/sh

# IFLV (假驴子) 一键安装脚本
# 版本: 1.0.0
# 支持平台: OpenWRT, iStore, 爱快, 小米路由器

# 日志函数
log() {
    echo "[IFLV安装] $1"
}

# 检测系统架构
detect_arch() {
    # 尝试使用opkg获取架构
    if command -v opkg >/dev/null 2>&1; then
        ARCH=$(opkg print-architecture | grep -oE "[a-z0-9_]+" | head -n 1)
        log "检测到OpenWRT架构: $ARCH"
        return 0
    fi
    
    # 尝试通过uname获取
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64)
            ARCH="x86_64"
            ;;
        aarch64|arm64)
            ARCH="aarch64_cortex-a53"
            ;;
        armv7*)
            ARCH="arm_cortex-a7"
            ;;
        mips*)
            ARCH="mipsel_24kc"
            ;;
        *)
            log "未能识别的架构: $ARCH"
            log "将尝试使用通用包"
            ARCH="all"
            ;;
    esac
    
    log "检测到系统架构: $ARCH"
    return 0
}

# 检测平台类型
detect_platform() {
    PLATFORM="openwrt"
    
    # 检查是否在Docker环境中
    if [ -f /.dockerenv ] || grep -q 'docker\|lxc' /proc/1/cgroup 2>/dev/null; then
        PLATFORM="docker"
    # 检查是否是iStore环境
    elif [ -d /tmp/istore ] || [ -f /etc/istore.info ]; then
        PLATFORM="istore"
    # 检查是否是爱快环境
    elif grep -q 'aiquik' /etc/os-release 2>/dev/null; then
        PLATFORM="aiquik"
    # 检查是否是小米路由器
    elif grep -q 'XiaoQiang' /etc/openwrt_release 2>/dev/null; then
        PLATFORM="xiaomi"
    # 检查是否是群晖环境
    elif [ -f /etc/synoinfo.conf ] || [ -f /etc/VERSION ]; then
        PLATFORM="synology"
    fi
    
    log "检测到平台类型: $PLATFORM"
    return 0
}

# 下载安装包
download_package() {
    DOWNLOAD_URL="https://github.com/taoZ60738868/IFLV/releases/download/v1.0.0/luci-app-iflv_1.0.0_${ARCH}.ipk"
    
    log "开始下载IFLV安装包..."
    log "下载地址: $DOWNLOAD_URL"
    
    # 确保临时目录存在
    mkdir -p /tmp/iflv
    
    # 下载安装包
    if command -v curl >/dev/null 2>&1; then
        curl -L "$DOWNLOAD_URL" -o /tmp/iflv/luci-app-iflv.ipk
    elif command -v wget >/dev/null 2>&1; then
        wget -O /tmp/iflv/luci-app-iflv.ipk "$DOWNLOAD_URL"
    else
        log "错误: 系统中未找到curl或wget，无法下载安装包"
        return 1
    fi
    
    # 检查下载是否成功
    if [ ! -f /tmp/iflv/luci-app-iflv.ipk ]; then
        log "错误: 安装包下载失败"
        return 1
    fi
    
    log "安装包下载完成"
    return 0
}

# 安装依赖
install_dependencies() {
    log "开始安装依赖..."
    
    case "$PLATFORM" in
        openwrt|istore|xiaomi)
            opkg update
            opkg install wget unzip tar gzip libustream-openssl ca-bundle
            ;;
        aiquik)
            # 爱快特定依赖
            opkg update
            opkg install wget unzip tar gzip libustream-openssl ca-bundle
            ;;
        synology)
            # 群晖NAS上使用Docker方式安装，无需额外依赖
            ;;
        docker)
            # Docker版本已包含依赖
            ;;
    esac
    
    log "依赖安装完成"
    return 0
}

# 安装IFLV
install_iflv() {
    log "开始安装IFLV..."
    
    case "$PLATFORM" in
        openwrt|istore|xiaomi|aiquik)
            opkg install /tmp/iflv/luci-app-iflv.ipk
            if [ $? -ne 0 ]; then
                log "错误: IFLV安装失败"
                return 1
            fi
            ;;
        synology)
            log "群晖平台请使用Docker方式安装IFLV"
            log "运行命令: docker run -d --network host --name iflv iflvteam/iflv:latest"
            return 1
            ;;
        docker)
            log "您已经在Docker环境中，无需再次安装"
            return 1
            ;;
    esac
    
    log "IFLV安装完成！"
    return 0
}

# 配置并启动服务
configure_service() {
    log "配置并启动IFLV服务..."
    
    # 启动服务
    if [ -f /etc/init.d/iflv ]; then
        /etc/init.d/iflv enable
        /etc/init.d/iflv start
    fi
    
    # 启动下载服务器
    if [ -f /usr/bin/iflv ]; then
        /usr/bin/iflv start_download
    fi
    
    log "IFLV服务已启动"
    log "您可以访问路由器管理界面，在'服务'菜单下找到'IFLV'进行配置"
    log "客户端可通过访问 http://[路由器IP]:8899 下载"
    
    return 0
}

# 清理临时文件
cleanup() {
    log "清理临时文件..."
    rm -rf /tmp/iflv
    log "安装过程完成"
}

# 主函数
main() {
    log "==== IFLV(假驴子) 一键安装脚本 ===="
    log "开始安装流程..."
    
    # 检测架构和平台
    detect_arch
    detect_platform
    
    # 下载并安装
    install_dependencies
    if download_package; then
        if install_iflv; then
            configure_service
        fi
    fi
    
    # 清理
    cleanup
    
    log "==== 安装完成 ===="
    log "如需帮助，请访问: https://github.com/taoZ60738868/IFLV"
}

# 执行主函数
main 