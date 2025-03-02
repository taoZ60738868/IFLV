# IFLV 开发者文档

本文档为IFLV项目的开发者文档，包含项目结构、核心代码说明和贡献指南，旨在帮助开发者了解项目架构并参与开发。

## 目录

- [项目概述](#项目概述)
- [项目结构](#项目结构)
- [核心模块](#核心模块)
- [代码规范](#代码规范)
- [贡献指南](#贡献指南)
- [参考项目](#参考项目)

## 项目概述

IFLV是一个为OpenWRT路由器开发的IPTV转发插件，通过将IPTV组播流转换为单播流，使家庭中的多个设备可以同时观看IPTV节目。项目主要包括以下功能模块：

- 组播转单播核心引擎
- EPG电子节目单管理
- 多平台客户端支持
- Web管理界面
- 版本更新与公告系统

## 项目结构

IFLV项目采用标准的OpenWRT LuCI应用程序结构，主要包含以下目录：

```
luci-app-iflv/             # 主要代码目录
├── Makefile               # OpenWRT编译配置
├── luasrc/                # LuCI界面代码
│   ├── controller/        # Web控制器
│   │   └── iflv.lua       # 主控制器
│   └── model/             # 数据模型
│       └── cbi/           # 配置界面
│           └── iflv.lua   # 配置模型
├── root/                  # 路由器文件系统代码
│   ├── etc/               # 配置文件
│   │   ├── config/        # UCI配置
│   │   │   └── iflv       # IFLV配置
│   │   ├── init.d/        # 初始化脚本
│   │   │   └── iflv       # 服务控制脚本
│   │   └── uci-defaults/  # 默认配置
│   │       └── luci-iflv  # 安装时初始化
│   └── usr/               # 程序文件
│       └── bin/           # 可执行文件
│           ├── iflv                  # 主程序
│           ├── iflv_update_epg       # EPG更新脚本
│           ├── iflv_download_server  # 下载服务脚本
│           └── iflv_announcement     # 公告系统脚本
└── htdocs/                # Web资源文件
    ├── luci-static/       # 静态资源
    │   └── resources/     # 资源文件
    │       └── iflv/      # IFLV特定资源
    └── www/               # Web文件
        └── iflv/          # IFLV Web目录

docs/                      # 文档目录
├── user_manual.md         # 用户手册
├── installation.md        # 安装指南
├── faq.md                 # 常见问题解答
├── developer.md           # 开发者文档
└── release_notes/         # 版本发布说明
    └── v1.1.0.md          # 1.1.0版本发布说明

assets/                    # 资源文件目录
├── images/                # 图片资源
└── screenshots/           # 截图目录

scripts/                   # 辅助脚本目录
tools/                     # 工具脚本目录
```

## 核心模块

### 1. 组播转单播引擎

组播转单播是IFLV的核心功能，实现原理如下：

- 通过IGMPv2/v3协议加入组播组
- 将组播流量引导到本地端口
- 通过HTTP/RTSP等协议重新分发给客户端

主要代码位于 `root/usr/bin/iflv`。

```bash
# 组播转单播核心逻辑示例
join_multicast_group() {
    # 加入组播组
    ip route add $MULTICAST_GROUP dev $INTERFACE
}

redirect_to_local_port() {
    # 将组播流量重定向到本地端口
    iptables -t nat -A PREROUTING -d $MULTICAST_GROUP -j REDIRECT --to-port $LOCAL_PORT
}
```

### 2. EPG更新系统

EPG更新系统负责获取、解析和优化电子节目单数据，主要功能包括：

- 多源数据获取与合并
- XML数据解析与优化
- 备份与恢复机制
- 频道自动匹配

主要代码位于 `root/usr/bin/iflv_update_epg`。

### 3. 公告系统

公告系统负责获取和显示版本更新信息，主要功能包括：

- 从服务器获取公告
- 版本比较与更新检测
- 历史公告管理
- 本地公告生成（开发用）

主要代码位于 `root/usr/bin/iflv_announcement`。

### 4. Web管理界面

基于LuCI框架开发的Web管理界面，主要包括：

- 全局配置
- 频道管理
- EPG设置
- 客户端下载
- 日志查看

主要代码位于 `luasrc/` 目录。

## 代码规范

### Shell脚本

1. 脚本文件头部需包含版本和功能说明
2. 使用函数封装功能模块
3. 添加适当的日志输出
4. 做好错误处理和资源清理
5. 参考代码添加相应注释

示例：

```bash
#!/bin/sh

# IFLV 脚本模板
# 版本: 1.1.0
# 功能: 功能描述

# 设置颜色输出
COLOR_INFO='\033[0;32m'
COLOR_NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    local message="$2"
    echo -e "${COLOR_INFO}[IFLV] $(date '+%Y-%m-%d %H:%M:%S') $level: $message${COLOR_NC}"
}

# 功能函数
function_name() {
    # 函数实现
}

# 主函数
main() {
    # 主要逻辑
}

main "$@"
```

### Lua代码

1. 使用LuCI框架标准结构
2. 变量和函数使用小写字母加下划线
3. 类和模块使用驼峰命名法
4. 添加适当的注释

示例：

```lua
--[[
IFLV Controller
]]--

module("luci.controller.iflv", package.seeall)

function index()
    -- 添加菜单项
    entry({"admin", "services", "iflv"}, cbi("iflv"), _("IFLV"), 10)
end

function action_status()
    -- 返回状态信息
end
```

## 贡献指南

我们欢迎任何形式的贡献，包括但不限于：

1. 报告Bug
2. 提交功能请求
3. 代码改进
4. 文档完善
5. 翻译工作

### 贡献流程

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 提交准则

- 代码变更需遵循项目代码规范
- 更新应包含相应的文档更新
- 提交信息应清晰描述变更内容
- 较大的变更请先创建Issue讨论

## 参考项目

IFLV在开发过程中参考了多个优秀的开源项目和社区资源。在此，我们对这些项目的贡献者表示诚挚的感谢。下面列出了主要参考项目及其对IFLV的影响：

### 主要参考项目

1. **[iptv-api](https://github.com/Guovin/iptv-api/)**
   - **参考内容**: EPG解析引擎、多源数据合并逻辑
   - **影响模块**: `iflv_update_epg` 脚本中的EPG处理部分
   - **具体实现**: 优化的EPG数据处理算法，特别是使用awk处理大型XML文件的方法

2. **[luci-app-store](https://github.com/jiecai58/luci-app-store)**
   - **参考内容**: LuCI界面框架、版本更新机制
   - **影响模块**: Web界面和公告系统
   - **具体实现**: `iflv_announcement`脚本的版本比较和更新检测机制

3. **[iptv-tool](https://github.com/super321/iptv-tool)**
   - **参考内容**: 频道扫描功能、协议识别优化
   - **影响模块**: 频道管理系统
   - **具体实现**: 改进的自动频道识别和分类算法

4. **[IPTV组播转发方案](https://www.right.com.cn/forum/thread-8319904-1-1.html)**
   - **参考内容**: 组播转单播核心实现思路
   - **影响模块**: 核心转发引擎
   - **具体实现**: 优化的组播组加入和数据转发逻辑

5. **[IPTV地址提取工具](https://github.com/gyssi007/-IPTV-/blob/main/IPTV%E5%9C%B0%E5%9D%80%E6%8F%90%E5%8F%96%E5%B7%A5%E5%85%B7.html)**
   - **参考内容**: IPTV地址识别与处理方法
   - **影响模块**: 频道URL解析系统
   - **具体实现**: 针对不同格式和协议的IPTV地址的规范化处理

6. **[xinjiawei/iptv](https://github.com/xinjiawei/iptv)**
   - **参考内容**: 客户端实现参考、流媒体协议处理
   - **影响模块**: 客户端连接和流处理
   - **具体实现**: 多协议支持和客户端连接处理逻辑

7. **[OpenWRT IPTV助手](https://www.right.com.cn/FORUM/thread-8413979-1-1.html)**
   - **参考内容**: IGMP代理配置方法、网络接口处理
   - **影响模块**: 网络配置和接口管理
   - **具体实现**: 自动配置IGMP代理和网络接口检测方法

### 参考代码示例

以下是一些参考实现的具体例子：

#### EPG数据优化 (参考自iptv-api)

```bash
# 优化EPG数据 (基于Guovin/iptv-api的数据优化方法，但使用更高效的awk实现)
optimize_epg_data() {
    local input_file="$1"
    local output_file="$2"
    
    # 创建临时文件
    local temp_output="${TEMP_DIR}/optimized_epg.xml"
    
    # 过滤未来MAX_PROGRAM_DAYS天内的节目
    local current_time=$(date +%s)
    local max_time=$((current_time + MAX_PROGRAM_DAYS * 86400))
    local max_date=$(date -d "@$max_time" +"%Y%m%d%H%M%S %z")
    
    # 使用awk处理日期筛选（更高效）
    awk -v max_date="$max_date" '
    /<programme / {
        # 提取start属性
        if (match($0, /start="([^"]+)"/)) {
            start_time = substr($0, RSTART+7, RLENGTH-8);
            if (start_time <= max_date) {
                print;
            }
        } else {
            print;
        }
    }
    !/<programme / && $0 !~ /<\/tv>/ {
        print;
    }
    /<\/tv>/ {
        print "</tv>";
    }
    ' "$input_file" | grep -A 1000000 -m 1 "<programme " >> "$temp_output"
}
```

#### 版本更新检测 (参考自luci-app-store)

```bash
# 下载公告 (基于luci-app-store的版本检测方法)
download_announcement() {
    # ...下载逻辑...
    
    # 比较版本号
    local new_version=$(grep -o "\"version\":[^,]*" "$temp_file" | cut -d'"' -f4)
    
    if [ -f "$CURRENT_ANN_FILE" ]; then
        local current_version=$(grep -o "\"version\":[^,]*" "$CURRENT_ANN_FILE" | cut -d'"' -f4)
        
        # 使用sort -V进行版本比较
        if echo "$current_version $new_version" | tr ' ' '\n' | sort -V | tail -n1 | grep -q "^$current_version$"; then
            log "info" "当前公告版本 $current_version 已是最新，无需更新"
            return 2
        fi
    }
}
```

### 合规使用与授权

所有参考的项目均遵循其原始许可证条款。我们确保:

1. 遵循原项目的许可证要求
2. 在代码中标注参考来源
3. 对参考代码进行了实质性修改和优化
4. 保持开源精神并回馈社区

感谢所有这些项目的作者和贡献者。正是因为开源社区的共享精神，才使得IFLV项目能够不断改进和完善。 