local m, s, o

-- EPG设置页面
m = Map("iflv", translate("IFLV EPG Settings"), translate("Configure Electronic Program Guide update frequency, sources and matching options"))

-- 获取服务状态
local status = luci.sys.call("pgrep -f iflv >/dev/null") == 0
if status then
    m.titleicon = "running.gif"
    m.title = translate("IFLV EPG") .. " - " .. translate("Running")
else
    m.titleicon = "stopped.gif"
    m.title = translate("IFLV EPG") .. " - " .. translate("Stopped")
end

-- EPG设置
s = m:section(TypedSection, "epg", translate("EPG Settings"))
s.anonymous = true
s.addremove = false

-- 启用EPG
o = s:option(Flag, "enabled", translate("Enable EPG"))
o.rmempty = false
o.default = "1"
o.description = translate("Enable EPG data fetching and matching with channels")

-- 更新间隔
o = s:option(Value, "update_interval", translate("Update Interval"))
o.datatype = "uinteger"
o.default = "24"
o.description = translate("Time interval in hours for automatic EPG updates")

-- EPG数据源
o = s:option(DynamicList, "sources", translate("EPG Sources"))
o.datatype = "string"
o:value("http://epg.51zmt.top:8000/e.xml", translate("51ZMT EPG (推荐)"))
o:value("https://epg.112114.xyz/e.xml", translate("112114 EPG"))
o:value("http://epg.51zmt.top:8000/cc.xml", translate("51ZMT CCTV EPG"))
o:value("http://epg.51zmt.top:8000/difang.xml", translate("51ZMT Local EPG"))
o:value("https://epg.112114.xyz/pp.xml", translate("112114 PP EPG"))
o.description = translate("URLs of EPG data sources, multiple sources will be merged")

-- 缓存天数
o = s:option(Value, "cache_days", translate("Cache Days"))
o.datatype = "uinteger"
o.default = "7"
o.description = translate("Number of days to keep EPG cache files")

-- 日志级别
o = s:option(ListValue, "log_level", translate("Log Level"))
o:value("error", translate("Error"))
o:value("warn", translate("Warning"))
o:value("info", translate("Info"))
o:value("debug", translate("Debug"))
o.default = "info"
o.description = translate("Detail level for EPG processing logs")

-- 操作按钮
s = m:section(TypedSection, "_dummy", translate("Actions"))
s.anonymous = true
s.addremove = false

-- 手动更新EPG按钮
o = s:option(Button, "_update", translate("Update EPG Now"))
o.inputtitle = translate("Update")
o.inputstyle = "apply"
o.write = function(self, section)
    luci.sys.call("/usr/bin/iflv_update_epg force > /dev/null 2>&1 &")
    luci.http.redirect(luci.dispatcher.build_url("admin", "services", "iflv", "epg"))
end

-- 匹配EPG按钮
o = s:option(Button, "_match", translate("Match EPG with Channels"))
o.inputtitle = translate("Match")
o.inputstyle = "apply"
o.write = function(self, section)
    luci.sys.call("/usr/bin/iflv match_epg > /dev/null 2>&1 &")
    luci.http.redirect(luci.dispatcher.build_url("admin", "services", "iflv", "epg"))
end

-- EPG状态
s = m:section(TypedSection, "_dummy2", translate("EPG Status"))
s.anonymous = true
s.addremove = false

-- EPG信息函数
local function epg_info()
    local epg_file = "/usr/share/iflv/epg/epg.xml"
    local info = {}
    
    -- 检查EPG文件是否存在
    if nixio.fs.access(epg_file) then
        -- 获取文件信息
        local stat = nixio.fs.stat(epg_file)
        info.size = string.format("%.2f", stat.size / 1024 / 1024) -- 转为MB
        info.mtime = os.date("%Y-%m-%d %H:%M:%S", stat.mtime)
        
        -- 获取频道和节目数量
        local cmd = 'grep -c "<channel" ' .. epg_file .. ' 2>/dev/null || echo 0'
        info.channels = luci.sys.exec(cmd):trim()
        
        local cmd = 'grep -c "<programme" ' .. epg_file .. ' 2>/dev/null || echo 0'
        info.programmes = luci.sys.exec(cmd):trim()
    else
        info.size = "0"
        info.mtime = "Never"
        info.channels = "0"
        info.programmes = "0"
    end
    
    return info
end

-- 获取EPG状态信息
local epg_status = epg_info()

-- 文件大小
o = s:option(DummyValue, "_size", translate("EPG File Size"))
o.default = epg_status.size .. " MB"

-- 最后更新时间
o = s:option(DummyValue, "_mtime", translate("Last Modified"))
o.default = epg_status.mtime

-- 频道数量
o = s:option(DummyValue, "_channels", translate("Channel Count"))
o.default = epg_status.channels

-- 节目数量
o = s:option(DummyValue, "_programmes", translate("Programme Count"))
o.default = epg_status.programmes

return m 