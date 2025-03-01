'use strict';
'require view';
'require form';
'require uci';
'require fs';
'require ui';
'require rpc';

var callSystemInfo = rpc.declare({
	object: 'iflv.system',
	method: 'info',
	expect: { result: {} }
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('iflv'),
			callSystemInfo()
		]);
	},

	render: function(data) {
		var m, s, o, ss;
		var systemInfo = data[1].result || {};

		m = new form.Map('iflv', _('IFLV - 系统设置'),
			_('配置IFLV系统参数和客户端设置。'));

		// 基本设置
		s = m.section(form.TypedSection, 'globals', _('基本设置'));
		s.anonymous = true;
		s.addremove = false;

		// 启用服务
		o = s.option(form.Flag, 'enabled', _('启用IFLV'));
		o.default = '0';
		o.rmempty = false;

		// 自动启动
		o = s.option(form.Flag, 'auto_start', _('开机自动启动'));
		o.default = '1';
		o.rmempty = false;

		// 系统设置
		s = m.section(form.TypedSection, 'system', _('系统设置'));
		s.anonymous = true;
		s.addremove = false;

		// 日志级别
		o = s.option(form.ListValue, 'log_level', _('日志级别'));
		o.value('debug', _('调试'));
		o.value('info', _('信息'));
		o.value('warn', _('警告'));
		o.value('error', _('错误'));
		o.default = 'info';
		o.rmempty = false;

		// 自动分析
		o = s.option(form.Flag, 'auto_analyze', _('自动分析数据包'));
		o.default = '1';
		o.description = _('系统将自动分析IPTV数据包并配置转发规则');
		o.rmempty = false;

		// 平台设置
		s = m.section(form.TypedSection, 'globals', _('平台设置'));
		s.anonymous = true;
		s.addremove = false;

		// 平台类型
		o = s.option(form.ListValue, 'platform', _('运行平台'));
		o.value('openwrt', _('OpenWRT'));
		o.value('istore', _('iStore'));
		o.value('aiquik', _('爱快路由器'));
		o.value('xiaomi', _('小米路由器'));
		o.value('synology', _('群晖NAS'));
		o.value('docker', _('Docker'));
		o.description = _('选择当前运行的平台环境，系统会根据平台进行优化');
		o.rmempty = false;

		// 检测平台按钮
		o = s.option(form.Button, '_detect_platform', _('检测平台'));
		o.inputtitle = _('自动检测');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return fs.exec('/usr/bin/iflv', ['check_platform']).then(function(res) {
				if (res.code === 0) {
					ui.addNotification(null, E('p', _('平台检测完成：') + res.stdout.trim()));
					return uci.load('iflv').then(function() {
						// 刷新页面显示检测到的平台
						window.location.reload();
					});
				} else {
					ui.addNotification(null, E('p', _('平台检测失败：') + res.stderr));
				}
			});
		};

		// 下载服务设置
		s = m.section(form.TypedSection, 'download', _('下载服务设置'));
		s.anonymous = true;
		s.addremove = false;
		s.description = _('配置客户端安装包下载服务');

		// 启用下载服务
		o = s.option(form.Flag, 'enabled', _('启用下载服务'));
		o.default = '1';
		o.rmempty = false;

		// HTTP端口
		o = s.option(form.Value, 'port', _('HTTP端口'));
		o.datatype = 'port';
		o.placeholder = '8899';
		o.rmempty = false;

		// 启用HTTPS
		o = s.option(form.Flag, 'https_enabled', _('启用HTTPS'));
		o.default = '0';
		o.rmempty = false;

		// HTTPS端口
		o = s.option(form.Value, 'https_port', _('HTTPS端口'));
		o.depends('https_enabled', '1');
		o.datatype = 'port';
		o.placeholder = '8443';
		o.rmempty = true;

		// 启用认证
		o = s.option(form.Flag, 'auth_required', _('启用认证'));
		o.default = '0';
		o.description = _('需要用户名和密码才能下载客户端');
		o.rmempty = false;

		// 用户名
		o = s.option(form.Value, 'username', _('用户名'));
		o.depends('auth_required', '1');
		o.placeholder = 'admin';
		o.rmempty = true;

		// 密码
		o = s.option(form.Value, 'password', _('密码'));
		o.depends('auth_required', '1');
		o.password = true;
		o.placeholder = 'iflv123';
		o.rmempty = true;

		// 下载服务控制
		o = s.option(form.SectionValue, '_download_service', form.NamedSection, '_download_control', 'dummy', _('下载服务控制'));
		ss = o.subsection;
		ss.anonymous = true;
		ss.addremove = false;

		// 启动服务按钮
		o = ss.option(form.Button, '_start_service', _('启动下载服务'));
		o.inputtitle = _('启动服务');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return fs.exec('/usr/bin/iflv', ['start_download']).then(function(res) {
				if (res.code === 0) {
					ui.addNotification(null, E('p', _('下载服务已启动')));
				} else {
					ui.addNotification(null, E('p', _('启动下载服务失败：') + res.stderr));
				}
			});
		};

		// 停止服务按钮
		o = ss.option(form.Button, '_stop_service', _('停止下载服务'));
		o.inputtitle = _('停止服务');
		o.inputstyle = 'reset';
		o.onclick = function() {
			return fs.exec('/usr/bin/iflv', ['stop_download']).then(function(res) {
				if (res.code === 0) {
					ui.addNotification(null, E('p', _('下载服务已停止')));
				} else {
					ui.addNotification(null, E('p', _('停止下载服务失败：') + res.stderr));
				}
			});
		};

		// 生成安装包按钮
		o = ss.option(form.Button, '_generate_packages', _('生成客户端安装包'));
		o.inputtitle = _('生成安装包');
		o.inputstyle = 'action';
		o.onclick = function() {
			return fs.exec('/usr/bin/iflv', ['generate_clients']).then(function(res) {
				if (res.code === 0) {
					ui.addNotification(null, E('p', _('客户端安装包已生成')));
				} else {
					ui.addNotification(null, E('p', _('生成安装包失败：') + res.stderr));
				}
			});
		};

		// 客户端更新设置
		s = m.section(form.TypedSection, 'client', _('客户端设置'));
		s.anonymous = true;
		s.addremove = false;
		s.description = _('配置客户端自动更新和版本信息');

		// 启用自动更新
		o = s.option(form.Flag, 'auto_update', _('启用自动更新'));
		o.default = '1';
		o.description = _('客户端定期检查并自动更新');
		o.rmempty = false;

		// 更新间隔
		o = s.option(form.Value, 'update_interval', _('更新检查间隔（小时）'));
		o.depends('auto_update', '1');
		o.datatype = 'uinteger';
		o.placeholder = '24';
		o.rmempty = false;

		// 启用自动启动
		o = s.option(form.Flag, 'auto_start', _('客户端自动启动'));
		o.default = '1';
		o.description = _('客户端开机自动启动');
		o.rmempty = false;

		// Android版本
		o = s.option(form.Value, 'android_version', _('Android客户端版本'));
		o.placeholder = '0.2.0';
		o.rmempty = false;

		// Windows版本
		o = s.option(form.Value, 'windows_version', _('Windows客户端版本'));
		o.placeholder = '0.2.0';
		o.rmempty = false;

		// Mac版本
		o = s.option(form.Value, 'mac_version', _('Mac客户端版本'));
		o.placeholder = '0.2.0';
		o.rmempty = false;

		// iOS版本
		o = s.option(form.Value, 'ios_version', _('iOS客户端版本'));
		o.placeholder = '0.2.0';
		o.rmempty = false;

		// 更新版本按钮
		o = s.option(form.Button, '_update_version', _('批量更新版本'));
		o.inputtitle = _('批量更新');
		o.inputstyle = 'action';
		o.onclick = function() {
			var version_input = window.prompt(_('请输入新版本号:'), '0.2.0');
			if (version_input) {
				return fs.exec('/usr/bin/iflv', ['update_clients', version_input]).then(function(res) {
					if (res.code === 0) {
						ui.addNotification(null, E('p', _('客户端版本已更新')));
						window.location.reload();
					} else {
						ui.addNotification(null, E('p', _('更新版本失败：') + res.stderr));
					}
				});
			}
		};

		// 系统信息
		s = m.section(form.TypedSection, '_info', _('系统信息'));
		s.anonymous = true;
		s.addremove = false;

		// 版本信息
		o = s.option(form.DummyValue, '_version', _('IFLV版本'));
		o.cfgvalue = function(section_id) {
			return systemInfo.version || '0.2.0';
		};

		// 构建日期
		o = s.option(form.DummyValue, '_build_date', _('构建日期'));
		o.cfgvalue = function(section_id) {
			return systemInfo.build_date || '2024-01-01';
		};

		// CPU使用率
		o = s.option(form.DummyValue, '_cpu_usage', _('CPU使用率'));
		o.cfgvalue = function(section_id) {
			return systemInfo.cpu_usage || '0%';
		};
		o.load = function() {
			return callSystemInfo().then(function(info) {
				var el = document.getElementById('_info_._cpu_usage');
				if (el && info.result) {
					el.textContent = info.result.cpu_usage || '0%';
				}
			});
		};

		// 内存使用率
		o = s.option(form.DummyValue, '_memory_usage', _('内存使用率'));
		o.cfgvalue = function(section_id) {
			return systemInfo.memory_usage || '0%';
		};
		o.load = function() {
			return callSystemInfo().then(function(info) {
				var el = document.getElementById('_info_._memory_usage');
				if (el && info.result) {
					el.textContent = info.result.memory_usage || '0%';
				}
			});
		};

		// 磁盘使用率
		o = s.option(form.DummyValue, '_disk_usage', _('磁盘使用率'));
		o.cfgvalue = function(section_id) {
			return systemInfo.disk_usage || '0%';
		};

		// 运行时间
		o = s.option(form.DummyValue, '_uptime', _('运行时间'));
		o.cfgvalue = function(section_id) {
			return formatUptime(systemInfo.uptime || 0);
		};

		// 格式化运行时间的辅助函数
		function formatUptime(seconds) {
			var days = Math.floor(seconds / 86400);
			var hours = Math.floor((seconds % 86400) / 3600);
			var minutes = Math.floor((seconds % 3600) / 60);
			var secs = seconds % 60;
			
			var result = '';
			if (days > 0) {
				result += days + '天 ';
			}
			if (hours > 0 || days > 0) {
				result += hours + '小时 ';
			}
			if (minutes > 0 || hours > 0 || days > 0) {
				result += minutes + '分钟 ';
			}
			result += secs + '秒';
			
			return result;
		}

		// 自动刷新系统信息
		setTimeout(function refreshInfo() {
			callSystemInfo().then(function(info) {
				if (info.result) {
					var el;
					
					el = document.getElementById('_info_._cpu_usage');
					if (el) el.textContent = info.result.cpu_usage || '0%';
					
					el = document.getElementById('_info_._memory_usage');
					if (el) el.textContent = info.result.memory_usage || '0%';
					
					el = document.getElementById('_info_._disk_usage');
					if (el) el.textContent = info.result.disk_usage || '0%';
					
					el = document.getElementById('_info_._uptime');
					if (el) el.textContent = formatUptime(info.result.uptime || 0);
				}
				
				setTimeout(refreshInfo, 5000);
			});
		}, 5000);

		return m.render();
	}
}); 