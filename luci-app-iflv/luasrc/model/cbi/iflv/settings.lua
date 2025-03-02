local m, s, o

-- 基本设置页面
m = Map("iflv", translate("IFLV 假驴子"), translate("IFLV (假驴子) 是一个 IPTV 转发系统，能将组播信号转为单播，让全家设备共享一个 IPTV 账号"))

-- 获取服务状态
local status = luci.sys.call("pgrep -f iflv >/dev/null") == 0
if status then
    m.titleicon = "running.gif"
    m.title = translate("IFLV") .. " - " .. translate("Running")
else
    m.titleicon = "stopped.gif"
    m.title = translate("IFLV") .. " - " .. translate("Stopped")
end

-- 常规设置
s = m:section(TypedSection, "globals", translate("General Settings"))
s.anonymous = true
s.addremove = false

-- 启用服务
o = s:option(Flag, "enabled", translate("Enable"))
o.rmempty = false

-- 工作模式
work_mode = s:option(ListValue, "work_mode", translate("Work Mode"))
work_mode:value("double", translate("Double Network Mode (双网线模式)"))
work_mode:value("vlan", translate("VLAN Mode (单线复用模式)"))
work_mode:value("passthrough", translate("VLAN Passthrough Mode (VLAN透传模式)"))
work_mode.default = "double"
work_mode.rmempty = false

-- 服务商选择
provider = s:option(ListValue, "provider", translate("IPTV Provider"))
provider:value("china_telecom", translate("China Telecom (中国电信)"))
provider:value("china_unicom", translate("China Unicom (中国联通)"))
provider:value("china_mobile", translate("China Mobile (中国移动)"))
provider:value("custom", translate("Custom (自定义)"))
provider.default = "china_telecom"
provider.rmempty = false

-- 网络接口设置
s = m:section(TypedSection, "interface", translate("Interface Settings"))
s.anonymous = true
s.addremove = false

-- WAN 接口
wan_if = s:option(Value, "wan_if", translate("IPTV Interface"), translate("Interface connected to IPTV source"))
wan_if.datatype = "string"
wan_if.default = "eth1"
wan_if:depends("work_mode", "double")

-- LAN 接口
lan_if = s:option(Value, "lan_if", translate("LAN Interface"), translate("Interface connected to local devices"))
lan_if.datatype = "string"
lan_if.default = "br-lan"

-- VLAN相关配置部分
s = m:section(TypedSection, "vlan_config", translate("VLAN Settings"))
s.anonymous = true
s.addremove = false

-- VLAN ID
vlan_id = s:option(Value, "vlan_id", translate("IPTV VLAN ID"), translate("VLAN ID for IPTV service"))
vlan_id.datatype = "uinteger"
vlan_id.default = "85"
vlan_id:depends({work_mode="vlan"})
vlan_id:depends({work_mode="passthrough"})

-- 内部VLAN ID
inner_vlan_id = s:option(Value, "inner_vlan_id", translate("Inner VLAN ID"), translate("Inner VLAN ID for IPTV service in passthrough mode"))
inner_vlan_id.datatype = "uinteger"
inner_vlan_id.default = "10"
inner_vlan_id:depends({work_mode="passthrough"})

-- 服务设置
s = m:section(TypedSection, "service", translate("Service Settings"))
s.anonymous = true
s.addremove = false

-- 服务端口
port = s:option(Value, "port", translate("Service Port"), translate("Port for IPTV forwarding service"))
port.datatype = "port"
port.default = "8888"

-- 缓冲区大小
buffer_size = s:option(Value, "buffer_size", translate("Buffer Size"), translate("Buffer size in KB for IPTV data"))
buffer_size.datatype = "uinteger"
buffer_size.default = "8192"

-- 缓存时间
cache_time = s:option(Value, "cache_time", translate("Cache Time"), translate("Time in seconds to cache channel data"))
cache_time.datatype = "uinteger"
cache_time.default = "300"

-- 操作按钮
s = m:section(TypedSection, "globals", translate("Actions"))
s.anonymous = true
s.addremove = false

-- 重新启动按钮
o = s:option(Button, "restart", translate("Restart Service"))
o.inputtitle = translate("Restart")
o.inputstyle = "reload"
o.write = function(self, section)
    luci.sys.call("/etc/init.d/iflv restart > /dev/null 2>&1")
    luci.http.redirect(luci.dispatcher.build_url("admin", "services", "iflv", "settings"))
end

-- 刷新频道列表按钮
o = s:option(Button, "refresh_channels", translate("Refresh Channel List"))
o.inputtitle = translate("Refresh")
o.inputstyle = "apply"
o.write = function(self, section)
    luci.sys.call("/usr/bin/iflv reload_channels > /dev/null 2>&1")
    luci.http.redirect(luci.dispatcher.build_url("admin", "services", "iflv", "settings"))
end

local t = Template("iflv/status")
m:append(t)

return m 