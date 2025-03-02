# Copyright (C) 2023-2024 IFLV Team
# This is free software, licensed under the GNU General Public License v3.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-iflv
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=IFLV Team

LUCI_TITLE:=LuCI support for IFLV (IPTV转发系统)
LUCI_DEPENDS:=+luci-base +tcpdump +iptables-mod-filter +iptables-mod-ipopt +ipset +kmod-ipt-ipset +libuci +wget +unzip +tar +gzip +libustream-openssl +ca-bundle +ca-certificates +openssl-util

# iStore兼容
LUCI_PKGARCH:=all
LUCI_DESCRIPTION:=IFLV(假驴子) - 智能IPTV转发和跨设备共享解决方案

# 不同平台支持
PKG_CONFIG_DEPENDS:= \
	CONFIG_IFLV_PLATFORM_OPENWRT \
	CONFIG_IFLV_PLATFORM_ISTORE \
	CONFIG_IFLV_PLATFORM_AIQUIK \
	CONFIG_IFLV_PLATFORM_XIAOMI \
	CONFIG_IFLV_PLATFORM_SYNOLOGY \
	CONFIG_IFLV_PLATFORM_DOCKER

# 平台选择配置
define Package/$(PKG_NAME)/config
choice
	prompt "Target Platform"
	default IFLV_PLATFORM_OPENWRT
	help
		Select the target platform for IFLV.

config IFLV_PLATFORM_OPENWRT
	bool "OpenWRT"
	help
		Standard OpenWRT platform.

config IFLV_PLATFORM_ISTORE
	bool "iStore"
	help
		iStore App Store platform.

config IFLV_PLATFORM_AIQUIK
	bool "爱快"
	help
		爱快路由器平台.

config IFLV_PLATFORM_XIAOMI
	bool "小米"
	help
		小米路由器平台.

config IFLV_PLATFORM_SYNOLOGY
	bool "群晖"
	help
		群晖NAS平台.

config IFLV_PLATFORM_DOCKER
	bool "Docker"
	help
		Docker容器化平台.
endchoice
endef

define Package/$(PKG_NAME)/conffiles
/etc/config/iflv
endef

include $(TOPDIR)/feeds/luci/luci.mk

# 平台特定编译选项
ifeq ($(CONFIG_IFLV_PLATFORM_ISTORE),y)
  EXTRA_CFLAGS += -DIFLV_PLATFORM_ISTORE
endif

ifeq ($(CONFIG_IFLV_PLATFORM_AIQUIK),y)
  EXTRA_CFLAGS += -DIFLV_PLATFORM_AIQUIK
endif

ifeq ($(CONFIG_IFLV_PLATFORM_XIAOMI),y)
  EXTRA_CFLAGS += -DIFLV_PLATFORM_XIAOMI
endif

ifeq ($(CONFIG_IFLV_PLATFORM_SYNOLOGY),y)
  EXTRA_CFLAGS += -DIFLV_PLATFORM_SYNOLOGY
endif

ifeq ($(CONFIG_IFLV_PLATFORM_DOCKER),y)
  EXTRA_CFLAGS += -DIFLV_PLATFORM_DOCKER
endif

# 增加iStore安装支持
define Package/$(PKG_NAME)/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	( . /etc/uci-defaults/luci-app-iflv ) && rm -f /etc/uci-defaults/luci-app-iflv
	mkdir -p /usr/share/iflv/downloads
	mkdir -p /usr/share/iflv/epg
	mkdir -p /usr/share/iflv/clients
	rm -f /tmp/luci-indexcache
	rm -f /tmp/luci-modulecache/*
	chmod +x /usr/bin/iflv*
	/etc/init.d/iflv enable >/dev/null 2>&1
	# 安装完成后自动启动服务
	/etc/init.d/iflv start >/dev/null 2>&1
	# 触发首次EPG更新
	( sleep 30 && /usr/bin/iflv_update_epg ) &
fi
exit 0
endef

# call BuildPackage - OpenWrt buildroot signature 