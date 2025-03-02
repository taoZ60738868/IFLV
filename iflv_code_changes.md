# IFLV 代码改进说明

本文档详细说明对IFLV项目中两个核心脚本的改进内容。

## 1. EPG更新脚本 (`iflv_update_epg`)

### 版本更新
- 从1.0.0升级到1.0.1

### 主要改进内容

#### 备份功能
```bash
# 新增备份目录定义
BACKUP_DIR="/usr/share/iflv/epg/backup"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 创建EPG备份
local backup_file="${BACKUP_DIR}/epg_$(date +%Y%m%d_%H%M%S).xml"
cp "$merged_file" "$backup_file"
log "info" "已创建EPG数据备份: $backup_file"

# 清理旧的备份文件
find "$BACKUP_DIR" -name "epg_*.xml" -type f -mtime +${CACHE_DAYS} -delete
```

#### 僵尸进程检测
```bash
# 检查锁文件创建时间，如果超过6小时，可能是僵尸进程
local lock_time=$(stat -c %Y "$LOCK_FILE")
local current_time=$(date +%s)
local diff=$(( current_time - lock_time ))

if [ $diff -gt 21600 ]; then
    log "warn" "锁文件超过6小时，可能是僵尸进程，尝试强制删除"
    rm -f "$LOCK_FILE"
    echo $$ > "$LOCK_FILE"
    return 0
else
    return 1
fi
```

#### 增强的日志功能
```bash
# 日志函数
log() {
    local level="$1"
    local message="$2"
    local color="$COLOR_NC"
    
    case "$level" in
        "info") color="$COLOR_INFO" ;;
        "warn") color="$COLOR_WARN" ;;
        "error") color="$COLOR_ERROR" ;;
        "debug") color="$COLOR_DEBUG" ;;
    esac
    
    # 输出到控制台
    echo -e "${color}[IFLV-EPG] $(date '+%Y-%m-%d %H:%M:%S') $level: $message${COLOR_NC}"
    
    # 记录到日志文件
    echo "[IFLV-EPG] $(date '+%Y-%m-%d %H:%M:%S') $level: $message" >> "$LOG_FILE"
}
```

#### 自动频道匹配功能
```bash
# 自动匹配频道
auto_match_channels() {
    log "info" "开始自动匹配频道与EPG数据"
    
    if [ ! -f "${EPG_DIR}/epg.xml" ]; then
        log "error" "EPG文件不存在，无法进行频道匹配"
        return 1
    fi
    
    if [ ! -f "$CHANNELS_FILE" ]; then
        log "error" "频道文件不存在，无法进行频道匹配"
        return 1
    fi
    
    # ...匹配逻辑实现...
    
    # 统计匹配数量
    local before_count=$(grep -c "\"epg_id\":\"[^\"]\+\"" "$temp_channels")
    local after_count=$(grep -c "\"epg_id\":\"[^\"]\+\"" "$matched_channels")
    
    log "info" "EPG频道匹配完成: 之前 $before_count 个匹配，现在 $after_count 个匹配"
}
```

#### 错误恢复机制
```bash
# 如果所有源都下载失败，尝试使用备份
if [ "$download_success" = "0" ]; then
    log "warn" "所有EPG源下载失败，尝试使用备份"
    
    # 获取最新的备份文件
    local latest_backup=$(ls -t "${BACKUP_DIR}/epg_"*.xml 2>/dev/null | head -n 1)
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        log "info" "使用备份文件: $latest_backup"
        cp "$latest_backup" "${TEMP_DIR}/epg_source_backup.xml"
        success=1
    else
        log "error" "没有可用的备份文件"
    fi
}
```

## 2. 下载服务器脚本 (`iflv_download_server`)

### 版本更新
- 从1.0.0升级到1.0.1

### 主要改进内容

#### HTTPS支持
```bash
# 新增SSL相关变量
SSL_DIR="/usr/share/iflv/ssl"
SSL_CERT="$SSL_DIR/cert.pem"
SSL_KEY="$SSL_DIR/key.pem"

# 创建SSL目录
mkdir -p $SSL_DIR

# 获取配置
config_get https_enabled download https_enabled "0"
config_get https_port download https_port "8443"
config_get cert_file download cert_file ""
config_get key_file download key_file ""
config_get auto_cert download auto_cert "1"
```

#### 自签名证书生成
```bash
# 生成自签名证书
generate_self_signed_cert() {
    log "info" "生成自签名SSL证书..."
    
    # 检查是否已存在证书
    if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
        log "info" "SSL证书已存在，使用现有证书"
        return 0
    fi
    
    # 获取路由器IP作为证书CN
    local router_ip=$(ip -4 addr show br-lan 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    
    # 生成私钥和证书
    openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
        -subj "/CN=${router_ip}/O=IFLV Self-Signed/C=CN" \
        -keyout "$SSL_KEY" -out "$SSL_CERT" 2>/dev/null
}
```

#### 版本管理功能
```bash
# 检查与更新客户端版本
check_client_versions() {
    log "info" "检查客户端版本更新"
    
    if [ "$CHECK_UPDATES" != "1" ]; then
        log "info" "客户端版本检查未启用，跳过"
        return 0
    fi
    
    # 尝试从官方源获取最新版本信息
    local version_url="https://iflv.io/api/versions.json"
    local temp_version_file="${TEMP_DIR}/versions.json"
    
    log "info" "尝试从 $version_url 获取最新版本信息"
    
    # 下载和验证逻辑...
}
```

#### 现代化UI
```bash
# 准备下载页面
prepare_download_page() {
    log "info" "准备下载页面"
    
    # 创建下载目录
    mkdir -p "$DOWNLOAD_DIR/css"
    mkdir -p "$DOWNLOAD_DIR/js"
    mkdir -p "$DOWNLOAD_DIR/images"
    
    # 创建现代化的HTML和CSS
    cat > "$DOWNLOAD_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IFLV(假驴子) 客户端下载</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
</head>
...
EOF
```

#### 安全增强
```bash
# 创建认证文件（如果需要）
if [ "$AUTH_REQUIRED" = "1" ]; then
    local passwd_file="${DOWNLOAD_DIR}/.htpasswd"
    if command -v htpasswd >/dev/null 2>&1; then
        htpasswd -cb "$passwd_file" "$AUTH_USERNAME" "$AUTH_PASSWORD" >/dev/null 2>&1
    else
        # 简单实现密码加密
        local encrypted_pwd=$(echo -n "$AUTH_PASSWORD" | md5sum | awk '{print $1}')
        echo "${AUTH_USERNAME}:${encrypted_pwd}" > "$passwd_file"
    fi
    
    log "info" "已创建认证文件，用户名: $AUTH_USERNAME"
    
    # 启动支持认证的服务器
    uhttpd -p "$DOWNLOAD_PORT" -h "$DOWNLOAD_DIR" -n 20 \
        -T 30 -A 1 -N 100 -R -r "$passwd_file" -m /=:$AUTH_USERNAME >/dev/null 2>&1 &
}
```

#### 启动HTTPS服务
```bash
# 启动HTTPS服务（如果启用）
if [ "$HTTPS_ENABLED" = "1" ] && [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    log "info" "启动HTTPS下载服务（端口: $HTTPS_PORT）"
    
    if [ "$AUTH_REQUIRED" = "1" ]; then
        # 启动支持认证的HTTPS服务器
        uhttpd -p "$HTTPS_PORT" -h "$DOWNLOAD_DIR" -n 20 \
            -T 30 -A 1 -N 100 -R -s "$SSL_CERT" -K "$SSL_KEY" \
            -r "${DOWNLOAD_DIR}/.htpasswd" -m /=:$AUTH_USERNAME >/dev/null 2>&1 &
    else
        # 启动无认证的HTTPS服务器
        uhttpd -p "$HTTPS_PORT" -h "$DOWNLOAD_DIR" -n 20 \
            -T 30 -A 1 -N 100 -R -s "$SSL_CERT" -K "$SSL_KEY" >/dev/null 2>&1 &
    fi
}
``` 