-- Copyright (C) 2023-2024 IFLV Team
-- This is free software, licensed under the GNU General Public License v3.

module("luci.controller.iflv", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/iflv") then
		return
	end

	entry({"admin", "services", "iflv"}, view("iflv/main"), _("IFLV"), 90).dependent = true
end 