module("luci.controller.iflv", package.seeall)

function index()
    if not nixio.fs.access("/etc/config/iflv") then
        return
    end
    
    entry({"admin", "services", "iflv"}, alias("admin", "services", "iflv", "settings"), _("IFLV"), 10).dependent = true
    entry({"admin", "services", "iflv", "settings"}, cbi("iflv/settings"), _("Settings"), 10).leaf = true
    entry({"admin", "services", "iflv", "channels"}, cbi("iflv/channels"), _("Channels"), 20).leaf = true
    entry({"admin", "services", "iflv", "epg"}, cbi("iflv/epg"), _("EPG"), 30).leaf = true
    entry({"admin", "services", "iflv", "download"}, cbi("iflv/download"), _("Download"), 40).leaf = true
    entry({"admin", "services", "iflv", "log"}, form("iflv/log"), _("Log"), 50).leaf = true
    entry({"admin", "services", "iflv", "status"}, call("action_status")).leaf = true
    entry({"admin", "services", "iflv", "refresh"}, call("action_refresh")).leaf = true
    entry({"admin", "services", "iflv", "get_channels"}, call("action_get_channels")).leaf = true
    entry({"admin", "services", "iflv", "save_channels"}, call("action_save_channels")).leaf = true
    entry({"admin", "services", "iflv", "update_epg"}, call("action_update_epg")).leaf = true
end

function action_status()
    local e = {}
    e.running = luci.sys.call("pgrep -f iflv >/dev/null") == 0
    luci.http.prepare_content("application/json")
    luci.http.write_json(e)
end

function action_refresh()
    luci.http.prepare_content("application/json")
    local data = {}
    
    -- 获取服务状态
    local status_file = "/usr/share/iflv/status_data.json"
    if nixio.fs.access(status_file) then
        data.status = luci.jsonc.parse(luci.sys.exec("cat " .. status_file))
    else
        data.status = {
            status = "unknown",
            channels_count = 0,
            active_connections = 0,
            download_server = "unknown",
            epg_last_update = ""
        }
    end
    
    -- 获取服务是否正在运行
    data.running = luci.sys.call("pgrep -f iflv >/dev/null") == 0
    
    -- 获取下载服务是否正在运行
    data.download_running = nixio.fs.access("/var/run/iflv_download.pid") and
        luci.sys.call("kill -0 $(cat /var/run/iflv_download.pid) >/dev/null 2>&1") == 0
    
    -- 获取最新日志
    data.log = luci.sys.exec("tail -n 20 /var/log/iflv.log | sed 's/\\x1b\\[[0-9;]*m//g'")
    
    luci.http.write_json(data)
end

function action_get_channels()
    local channels_file = "/usr/share/iflv/channels.json"
    local data = {}
    
    if nixio.fs.access(channels_file) then
        data = luci.jsonc.parse(luci.sys.exec("cat " .. channels_file))
    else
        data = { channels = {} }
    end
    
    luci.http.prepare_content("application/json")
    luci.http.write_json(data)
end

function action_save_channels()
    local channels_file = "/usr/share/iflv/channels.json"
    local channels_data = luci.http.formvalue("channels")
    
    if channels_data then
        nixio.fs.writefile(channels_file, channels_data)
        luci.http.prepare_content("application/json")
        luci.http.write_json({success = true})
    else
        luci.http.prepare_content("application/json")
        luci.http.write_json({success = false, message = "No channel data received"})
    end
end

function action_update_epg()
    luci.sys.call("/usr/bin/iflv_update_epg force &")
    luci.http.prepare_content("application/json")
    luci.http.write_json({success = true})
end 