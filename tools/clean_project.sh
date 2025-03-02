#!/bin/bash

# IFLV项目目录清理脚本
# 版本: 1.1.0
# 功能: 清理项目目录，删除无用文件，优化结构

# 设置颜色输出
COLOR_INFO='\033[0;32m'
COLOR_WARN='\033[0;33m'
COLOR_ERROR='\033[0;31m'
COLOR_NC='\033[0m' # 无颜色

# 项目根目录（脚本相对路径）
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 日志函数
log() {
    local level="$1"
    local message="$2"
    local color="$COLOR_NC"
    
    case "$level" in
        "info") color="$COLOR_INFO" ;;
        "warn") color="$COLOR_WARN" ;;
        "error") color="$COLOR_ERROR" ;;
    esac
    
    echo -e "${color}[IFLV-清理] $level: $message${COLOR_NC}"
}

# 创建目录函数
create_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log "info" "创建目录: $dir"
    fi
}

# 询问确认
ask_confirmation() {
    local question="$1"
    local default="$2"
    
    if [ "$default" = "Y" ]; then
        local options="[Y/n]"
    else
        local options="[y/N]"
    fi
    
    read -p "$question $options " answer
    
    if [ -z "$answer" ]; then
        answer="$default"
    fi
    
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# 检查脚本是否在项目根目录执行
if [ ! -d "$PROJECT_ROOT/luci-app-iflv" ]; then
    log "error" "脚本必须在IFLV项目目录中执行"
    exit 1
fi

cd "$PROJECT_ROOT"

log "info" "开始清理IFLV项目目录"
log "info" "项目根目录: $PROJECT_ROOT"

# 统计清理前的文件数量和大小
before_files=$(find . -type f | wc -l)
before_size=$(du -sh . | awk '{print $1}')

log "info" "清理前：${before_files}个文件，总大小${before_size}"

# 创建标准目录结构
log "info" "正在创建标准目录结构..."

create_directory "$PROJECT_ROOT/docs"
create_directory "$PROJECT_ROOT/tools"
create_directory "$PROJECT_ROOT/assets/images"
create_directory "$PROJECT_ROOT/assets/screenshots"
create_directory "$PROJECT_ROOT/scripts"

# 整理文档
log "info" "整理文档文件..."

# 移动各类md文件到docs目录
for md_file in $(find . -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "CHANGELOG.md" -type f); do
    if [ -f "$md_file" ]; then
        filename=$(basename "$md_file")
        if [ ! -f "docs/$filename" ]; then
            mv "$md_file" "docs/"
            log "info" "移动文件: $md_file -> docs/$filename"
        else
            log "warn" "文件已存在，跳过移动: docs/$filename"
        fi
    fi
done

# 检查并删除临时文件和备份文件
log "info" "检查临时文件和备份文件..."

# 列出可能要删除的文件类型
temp_files=$(find . -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*~" -o -name "*.swp" -o -name ".DS_Store" \))

if [ -n "$temp_files" ]; then
    echo "$temp_files"
    
    if ask_confirmation "是否删除以上临时文件？" "Y"; then
        find . -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*~" -o -name "*.swp" -o -name ".DS_Store" \) -delete
        log "info" "已删除临时文件"
    else
        log "info" "已跳过删除临时文件"
    fi
else
    log "info" "未发现临时文件"
fi

# 检查并删除构建文件
log "info" "检查构建文件和缓存..."

# 查找编译缓存和构建目录
build_dirs=$(find . -type d \( -name "build" -o -name "dist" -o -name "node_modules" -o -name "__pycache__" \))

if [ -n "$build_dirs" ]; then
    echo "$build_dirs"
    
    if ask_confirmation "是否删除以上构建文件和缓存目录？" "N"; then
        for dir in $build_dirs; do
            rm -rf "$dir"
            log "info" "已删除目录: $dir"
        done
    else
        log "info" "已跳过删除构建文件和缓存目录"
    fi
else
    log "info" "未发现构建文件和缓存目录"
fi

# 检查重复文件
log "info" "检查重复文件..."

if command -v fdupes >/dev/null 2>&1; then
    duplicates=$(fdupes -r .)
    
    if [ -n "$duplicates" ]; then
        echo "$duplicates"
        
        if ask_confirmation "是否删除重复文件（保留一个副本）？" "N"; then
            fdupes -r -d -N . >/dev/null 2>&1
            log "info" "已删除重复文件"
        else
            log "info" "已跳过删除重复文件"
        fi
    else
        log "info" "未发现重复文件"
    fi
else
    log "warn" "未安装fdupes工具，跳过重复文件检查"
    log "info" "您可以通过以下命令安装fdupes: apt-get install fdupes 或 brew install fdupes"
fi

# 优化 luci-app-iflv 目录
log "info" "优化核心代码目录结构..."

# 检查是否存在不必要的文件
if [ -d "luci-app-iflv" ]; then
    # 删除备份文件
    find luci-app-iflv -name "*.orig" -delete
    find luci-app-iflv -name "*.rej" -delete
    
    # 检查不必要的测试文件
    test_files=$(find luci-app-iflv -name "test_*" -o -name "*_test.sh")
    
    if [ -n "$test_files" ]; then
        echo "$test_files"
        
        if ask_confirmation "是否删除测试文件（建议在确认功能稳定后删除）？" "N"; then
            for file in $test_files; do
                rm -f "$file"
                log "info" "已删除测试文件: $file"
            done
        else
            log "info" "已跳过删除测试文件"
        fi
    else
        log "info" "未发现测试文件"
    fi
fi

# 移动脚本文件
log "info" "整理脚本文件..."

# 移动根目录下的sh脚本到scripts目录
for script in $(find . -maxdepth 1 -name "*.sh" -type f); do
    if [ -f "$script" ]; then
        script_name=$(basename "$script")
        
        # 不移动clean_project.sh本身
        if [ "$script_name" != "clean_project.sh" ]; then
            if [ ! -f "scripts/$script_name" ]; then
                mv "$script" "scripts/"
                log "info" "移动脚本: $script -> scripts/$script_name"
            else
                log "warn" "脚本已存在，跳过移动: scripts/$script_name"
            fi
        fi
    fi
done

# 创建并更新.gitignore
log "info" "更新.gitignore文件..."

if [ ! -f ".gitignore" ]; then
    cat > ".gitignore" << EOL
# 系统文件
.DS_Store
Thumbs.db

# 编辑器和IDE文件
.idea/
.vscode/
*.swp
*~
*.bak

# 构建文件
build/
dist/
*.o
*.lo
*.la
*.al
*.so
*.so.[0-9]*
*.a

# 日志文件
*.log

# 临时文件
tmp/
temp/
*.tmp

# 备份文件
*.bak
*.orig
*.rej

# Node.js
node_modules/
npm-debug.log

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
EOL
    log "info" "已创建.gitignore文件"
else
    log "info" ".gitignore文件已存在，跳过创建"
fi

# 统计清理后的文件数量和大小
after_files=$(find . -type f | wc -l)
after_size=$(du -sh . | awk '{print $1}')

# 计算减少了多少
files_reduced=$((before_files - after_files))
log "info" "清理后：${after_files}个文件，总大小${after_size}"
log "info" "共减少了${files_reduced}个文件"

# 最终建议
log "info" "项目目录清理完成！"
log "info" "下面是优化后的目录结构建议："
echo -e "${COLOR_INFO}"
echo "IFLV项目目录结构建议："
echo "├── README.md               # 项目主要说明文档"
echo "├── CHANGELOG.md            # 版本更新记录"
echo "├── luci-app-iflv/          # 主要代码目录"
echo "│   ├── Makefile            # OpenWRT编译配置"
echo "│   ├── luasrc/             # LuCI界面代码"
echo "│   ├── root/               # 路由器文件系统代码"
echo "│   └── htdocs/             # Web资源文件"
echo "├── docs/                   # 文档目录"
echo "│   ├── user_manual.md      # 用户手册"
echo "│   ├── installation.md     # 安装指南"
echo "│   └── faq.md              # 常见问题解答"
echo "├── assets/                 # 资源文件目录"
echo "│   ├── images/             # 图片资源"
echo "│   └── screenshots/        # 截图目录"
echo "├── scripts/                # 辅助脚本目录"
echo "└── tools/                  # 工具脚本目录"
echo "    └── clean_project.sh    # 本清理脚本"
echo -e "${COLOR_NC}"

log "info" "请检查清理结果，确保重要文件没有被误删。" 