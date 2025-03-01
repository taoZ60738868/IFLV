#!/bin/sh

# IFLV (假驴子) 一键安装脚本
# 版本: 1.0.1
# 支持平台: OpenWRT, iStore, 爱快, 小米路由器, 群晖NAS, Docker

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 日志函数
log() {
    local level="$1"
    local message="$2"
    
    case "$level" in
        info)
            echo -e "${GREEN}[IFLV安装] $message${NC}"
            ;;
        warn)
            echo -e "${YELLOW}[IFLV安装] $message${NC}"
            ;;
        error)
            echo -e "${RED}[IFLV安装] $message${NC}"
            ;;
        *)
            echo -e "${BLUE}[IFLV安装] $message${NC}"
            ;;
    esac
}

# 检测系统架构
detect_arch() {
    # 尝试使用opkg获取架构
    if command -v opkg >/dev/null 2>&1; then
        ARCH=$(opkg print-architecture | grep -oE "[a-z0-9_]+" | head -n 1)
        log "info" "检测到OpenWRT架构: $ARCH"
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
        armv8*|armv8a)
            ARCH="aarch64_generic"
            ;;
        mips*)
            if echo "$ARCH" | grep -q "el"; then
                ARCH="mipsel_24kc"
            else
                ARCH="mips_24kc"
            fi
            ;;
        *)
            log "warn" "未能识别的架构: $ARCH"
            log "warn" "将尝试使用通用包"
            ARCH="all"
            ;;
    esac
    
    log "info" "检测到系统架构: $ARCH"
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
    elif grep -q 'aiquik\|ikuai' /etc/os-release 2>/dev/null; then
        PLATFORM="aiquik"
    # 检查是否是小米路由器
    elif grep -q 'XiaoQiang\|xiaomi' /etc/openwrt_release 2>/dev/null; then
        PLATFORM="xiaomi"
    # 检查是否是群晖环境
    elif [ -f /etc/synoinfo.conf ] || [ -f /etc/VERSION ]; then
        PLATFORM="synology"
    fi
    
    log "info" "检测到平台类型: $PLATFORM"
    return 0
}

# 下载安装包
download_package() {
    # 获取稳定版本号
    VERSION="1.0.0"
    DOWNLOAD_URL="https://github.com/taoZ60738868/IFLV/releases/download/v${VERSION}/luci-app-iflv_${VERSION}_${ARCH}.ipk"
    FALLBACK_URL="https://iflv.io/downloads/luci-app-iflv_${VERSION}_${ARCH}.ipk"
    
    log "info" "开始下载IFLV安装包 v${VERSION}..."
    log "info" "下载地址: $DOWNLOAD_URL"
    
    # 确保临时目录存在
    mkdir -p /tmp/iflv
    
    # 下载安装包
    if command -v curl >/dev/null 2>&1; then
        if curl -L --fail "$DOWNLOAD_URL" -o /tmp/iflv/luci-app-iflv.ipk; then
            log "info" "从GitHub下载成功"
        elif curl -L --fail "$FALLBACK_URL" -o /tmp/iflv/luci-app-iflv.ipk; then
            log "info" "从备用服务器下载成功"
        else
            log "error" "下载失败: 无法从任何服务器获取安装包"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget -O /tmp/iflv/luci-app-iflv.ipk "$DOWNLOAD_URL"; then
            log "info" "从GitHub下载成功"
        elif wget -O /tmp/iflv/luci-app-iflv.ipk "$FALLBACK_URL"; then
            log "info" "从备用服务器下载成功"
        else
            log "error" "下载失败: 无法从任何服务器获取安装包"
            return 1
        fi
    else
        log "error" "系统中未找到curl或wget，无法下载安装包"
        return 1
    fi
    
    # 检查下载是否成功
    if [ ! -f /tmp/iflv/luci-app-iflv.ipk ] || [ ! -s /tmp/iflv/luci-app-iflv.ipk ]; then
        log "error" "安装包下载失败或文件大小为零"
        return 1
    fi
    
    log "info" "安装包下载完成 ($(ls -lh /tmp/iflv/luci-app-iflv.ipk | awk '{print $5}'))"
    return 0
}

# 安装依赖
install_dependencies() {
    log "info" "开始安装依赖..."
    
    case "$PLATFORM" in
        openwrt|istore|xiaomi)
            opkg update
            opkg install wget unzip tar gzip libustream-openssl ca-bundle ca-certificates openssl-util
            ;;
        aiquik)
            # 爱快特定依赖
            opkg update
            opkg install wget unzip tar gzip libustream-openssl ca-bundle ca-certificates openssl-util
            ;;
        synology)
            # 群晖NAS上使用Docker方式安装，无需额外依赖
            ;;
        docker)
            # Docker版本已包含依赖
            ;;
    esac
    
    log "info" "依赖安装完成"
    return 0
}

# 安装IFLV
install_iflv() {
    log "info" "开始安装IFLV..."
    
    case "$PLATFORM" in
        openwrt|istore|xiaomi|aiquik)
            opkg install /tmp/iflv/luci-app-iflv.ipk
            if [ $? -ne 0 ]; then
                log "error" "IFLV安装失败"
                return 1
            fi
            # 检查是否需要安装语言包
            if [ -f /tmp/iflv/luci-i18n-iflv-zh-cn.ipk ]; then
                log "info" "安装中文语言包..."
                opkg install /tmp/iflv/luci-i18n-iflv-zh-cn.ipk
            fi
            ;;
        synology)
            log "info" "群晖平台请使用Docker方式安装IFLV"
            log "info" "运行命令: docker run -d --network host --name iflv iflvteam/iflv:latest"
            # 检查是否安装了Docker
            if command -v docker >/dev/null 2>&1; then
                log "info" "检测到Docker已安装，正在拉取IFLV镜像..."
                docker pull iflvteam/iflv:latest
                docker run -d --network host --restart always --name iflv iflvteam/iflv:latest
                log "info" "IFLV Docker容器已启动"
                return 0
            else
                log "warn" "未检测到Docker，请先在套件中心安装Docker"
                return 1
            fi
            ;;
        docker)
            log "info" "检测到Docker环境，正在更新IFLV容器..."
            docker pull iflvteam/iflv:latest
            # 检查是否已有运行的容器
            if docker ps -a | grep -q "iflv"; then
                log "info" "更新现有容器..."
                docker stop iflv
                docker rm iflv
            fi
            docker run -d --network host --restart always --name iflv iflvteam/iflv:latest
            log "info" "IFLV Docker容器已更新并启动"
            return 0
            ;;
    esac
    
    log "info" "IFLV安装完成！"
    return 0
}

# 配置并启动服务
configure_service() {
    log "info" "配置并启动IFLV服务..."
    
    # 启动服务
    if [ -f /etc/init.d/iflv ]; then
        /etc/init.d/iflv enable
        /etc/init.d/iflv start
        if [ $? -eq 0 ]; then
            log "info" "IFLV服务已成功启动"
        else
            log "warn" "IFLV服务启动可能存在问题，请检查日志"
        fi
    fi
    
    # 启动下载服务器
    if [ -f /usr/bin/iflv ]; then
        /usr/bin/iflv start_download
        log "info" "IFLV下载服务已启动"
    fi
    
    # 获取路由器IP地址
    ROUTER_IP=$(ip -4 addr show br-lan 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    if [ -z "$ROUTER_IP" ]; then
        ROUTER_IP=$(ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
    if [ -z "$ROUTER_IP" ]; then
        ROUTER_IP="路由器IP"
    fi
    
    log "info" "您可以访问路由器管理界面，在'服务'菜单下找到'IFLV'进行配置"
    log "info" "客户端可通过访问 http://${ROUTER_IP}:8899 下载"
    
    return 0
}

# 清理临时文件
cleanup() {
    log "info" "清理临时文件..."
    rm -rf /tmp/iflv
    log "info" "安装过程完成"
}

# 显示安装后信息
show_post_install_info() {
    log "info" "======================================"
    log "info" "       IFLV(假驴子) 安装成功!          "
    log "info" "======================================"
    
    # 获取路由器IP地址
    ROUTER_IP=$(ip -4 addr show br-lan 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    if [ -z "$ROUTER_IP" ]; then
        ROUTER_IP=$(ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
    if [ -z "$ROUTER_IP" ]; then
        ROUTER_IP="路由器IP"
    fi
    
    log "info" "管理界面: http://${ROUTER_IP}/cgi-bin/luci/admin/services/iflv"
    log "info" "客户端下载: http://${ROUTER_IP}:8899"
    log "info" "使用帮助: https://github.com/taoZ60738868/IFLV"
    log "info" "======================================"
}

# 检测已安装版本
check_installed_version() {
    if [ -f /usr/lib/opkg/info/luci-app-iflv.control ]; then
        INSTALLED_VER=$(grep -oP '(?<=Version: ).+' /usr/lib/opkg/info/luci-app-iflv.control)
        log "info" "检测到已安装IFLV版本: $INSTALLED_VER"
        return 0
    elif docker ps | grep -q "iflvteam/iflv"; then
        INSTALLED_VER=$(docker inspect iflvteam/iflv:latest | grep -oP '(?<="Created": ").+(?=",)')
        log "info" "检测到已安装IFLV Docker版本，创建时间: $INSTALLED_VER"
        return 0
    fi
    log "info" "未检测到已安装的IFLV版本"
    return 1
}

# 主函数
main() {
    log "info" "==== IFLV(假驴子) 一键安装脚本 ===="
    log "info" "开始安装流程..."
    
    # 检测架构和平台
    detect_arch
    detect_platform
    
    # 检查已安装版本
    check_installed_version
    
    # 下载并安装
    install_dependencies
    if download_package; then
        if install_iflv; then
            configure_service
            show_post_install_info
        fi
    fi
    
    # 清理
    cleanup
    
    log "info" "==== 安装完成 ===="
    log "info" "如需帮助，请访问: https://github.com/taoZ60738868/IFLV"
}

# 执行主函数
main 