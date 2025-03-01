'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require fs';
'require rpc';

// RPC调用
var callServiceStatus = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

var callProxyStatus = rpc.declare({
	object: 'iflv.proxy',
	method: 'status',
	expect: { result: {} }
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('iflv'),
			callProxyStatus()
		]);
	},

	render: function(data) {
		var m, s, o, ss;
		var proxyStatus = data[1].result || {};

		m = new form.Map('iflv', _('IFLV - IPTV模拟'),
			_('配置IPTV数据包模拟参数。系统将分析截获的IPTV数据包，模拟IPTV机顶盒行为，将IPTV组播转为单播。'));

		// 基本设置
		s = m.section(form.TypedSection, 'proxy', _('基本设置'));
		s.anonymous = true;
		s.addremove = false;

		// 启用IPTV模拟
		o = s.option(form.Flag, 'enabled', _('启用IPTV模拟'));
		o.default = '1';
		o.rmempty = false;
		
		// 绑定地址
		o = s.option(form.Value, 'bind_addr', _('绑定地址'));
		o.datatype = 'ipaddr';
		o.placeholder = '0.0.0.0';
		o.description = _('服务绑定的IP地址，默认为0.0.0.0（所有地址）');
		o.rmempty = false;
		
		// HTTP端口
		o = s.option(form.Value, 'http_port', _('HTTP端口'));
		o.datatype = 'port';
		o.placeholder = '8888';
		o.description = _('HTTP服务端口，用于访问IPTV直播流');
		o.rmempty = false;
		
		// HTTPS端口
		o = s.option(form.Value, 'https_port', _('HTTPS端口'));
		o.datatype = 'port';
		o.placeholder = '8443';
		o.description = _('HTTPS服务端口（可选）');
		o.rmempty = true;
		
		// 用户认证
		o = s.option(form.Flag, 'auth_enabled', _('启用用户认证'));
		o.default = '0';
		o.description = _('启用后需要用户名和密码才能访问IPTV服务');
		o.rmempty = false;
		
		// 用户名
		o = s.option(form.Value, 'username', _('用户名'));
		o.depends('auth_enabled', '1');
		o.description = _('访问IPTV服务的用户名');
		o.rmempty = true;
		
		// 密码
		o = s.option(form.Value, 'password', _('密码'));
		o.depends('auth_enabled', '1');
		o.password = true;
		o.description = _('访问IPTV服务的密码');
		o.rmempty = true;
		
		// 缓冲设置
		s = m.section(form.TypedSection, 'buffer', _('缓冲设置'));
		s.anonymous = true;
		s.addremove = false;
		
		// 缓冲大小
		o = s.option(form.Value, 'buffer_size', _('缓冲大小 (KB)'));
		o.datatype = 'uinteger';
		o.placeholder = '1024';
		o.description = _('视频流缓冲区大小，增大可减少卡顿但会增加延迟');
		o.rmempty = false;
		
		// 转发超时
		o = s.option(form.Value, 'proxy_timeout', _('转发超时 (秒)'));
		o.datatype = 'uinteger';
		o.placeholder = '30';
		o.description = _('无数据传输时的超时时间');
		o.rmempty = false;
		
		// 最大连接数
		o = s.option(form.Value, 'max_connections', _('最大连接数'));
		o.datatype = 'uinteger';
		o.placeholder = '10';
		o.description = _('每个频道允许的最大并发连接数');
		o.rmempty = false;
		
		// 高级设置
		s = m.section(form.TypedSection, 'advanced', _('高级设置'));
		s.anonymous = true;
		s.addremove = false;
		
		// 用户代理
		o = s.option(form.Value, 'user_agent', _('用户代理'));
		o.placeholder = 'IFLV/1.0';
		o.description = _('模拟的HTTP请求用户代理字符串');
		o.rmempty = false;
		
		// 特征关键词
		o = s.option(form.DynamicList, 'keywords', _('数据包特征关键词'));
		o.description = _('用于识别IPTV数据包的特征关键词');
		o.rmempty = true;
		
		// 请求头
		o = s.option(form.DynamicList, 'headers', _('附加请求头'));
		o.description = _('格式：Header: Value');
		o.rmempty = true;
		
		// RTSP支持
		o = s.option(form.Flag, 'enable_rtsp', _('启用RTSP支持'));
		o.default = '1';
		o.description = _('启用RTSP协议支持，用于某些IPTV服务');
		o.rmempty = false;
		
		// 访问控制
		s = m.section(form.TypedSection, 'access', _('访问控制'));
		s.anonymous = true;
		s.addremove = false;
		
		// 访问控制启用
		o = s.option(form.Flag, 'access_control', _('启用访问控制'));
		o.default = '0';
		o.rmempty = false;
		
		// 允许访问的IP地址
		o = s.option(form.DynamicList, 'allowed_ips', _('允许的IP地址'));
		o.depends('access_control', '1');
		o.datatype = 'ipaddr';
		o.description = _('允许访问IPTV服务的IP地址列表');
		o.rmempty = true;
		
		// 允许的MAC地址
		o = s.option(form.DynamicList, 'allowed_macs', _('允许的MAC地址'));
		o.depends('access_control', '1');
		o.datatype = 'macaddr';
		o.description = _('允许访问IPTV服务的MAC地址列表');
		o.rmempty = true;
		
		// 状态信息
		s = m.section(form.TypedSection, '_status', _('运行状态'));
		s.anonymous = true;
		
		// 当前状态
		o = s.option(form.DummyValue, '_current_status');
		o.cfgvalue = function(section_id) {
			var html = '<div class="proxy-status">';
			
			if (proxyStatus.running) {
				html += '<div class="status-item"><span class="label">状态:</span> <span class="value running">运行中</span></div>';
				html += '<div class="status-item"><span class="label">监听地址:</span> <span class="value">' + (proxyStatus.bind_addr || 'N/A') + '</span></div>';
				html += '<div class="status-item"><span class="label">HTTP端口:</span> <span class="value">' + (proxyStatus.http_port || 'N/A') + '</span></div>';
				
				if (proxyStatus.https_port) {
					html += '<div class="status-item"><span class="label">HTTPS端口:</span> <span class="value">' + proxyStatus.https_port + '</span></div>';
				}
				
				html += '<div class="status-item"><span class="label">活动连接:</span> <span class="value">' + (proxyStatus.active_connections || '0') + '</span></div>';
				html += '<div class="status-item"><span class="label">转发流量:</span> <span class="value">' + (proxyStatus.transferred_bytes ? formatBytes(proxyStatus.transferred_bytes) : '0 B') + '</span></div>';
			} else {
				html += '<div class="status-item"><span class="label">状态:</span> <span class="value stopped">已停止</span></div>';
			}
			
			html += '</div>';
			return html;
		};
		
		// 应用设置按钮
		o = s.option(form.Button, '_apply', _('应用设置'));
		o.inputtitle = _('应用设置');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return m.save().then(function() {
				return fs.exec('/etc/init.d/iflv', ['restart']).then(function() {
					ui.addNotification(null, E('p', _('设置已应用，服务已重启')));
				}).catch(function(e) {
					ui.addNotification(null, E('p', _('应用设置失败: ') + e.message));
				});
			});
		};
		
		// 访问信息
		s = m.section(form.TypedSection, '_access_info', _('访问信息'));
		s.anonymous = true;
		
		// 访问地址
		o = s.option(form.DummyValue, '_access_urls');
		o.cfgvalue = function(section_id) {
			var lanIP = proxyStatus.lan_ip || '192.168.1.1';
			var httpPort = proxyStatus.http_port || '8888';
			var httpsPort = proxyStatus.https_port;
			
			var html = '<div class="access-urls">';
			html += '<div><strong>HTTP访问地址:</strong></div>';
			html += '<div class="url-item"><a href="http://' + lanIP + ':' + httpPort + '/" target="_blank">http://' + lanIP + ':' + httpPort + '/</a></div>';
			
			if (httpsPort) {
				html += '<div><strong>HTTPS访问地址:</strong></div>';
				html += '<div class="url-item"><a href="https://' + lanIP + ':' + httpsPort + '/" target="_blank">https://' + lanIP + ':' + httpsPort + '/</a></div>';
			}
			
			html += '<div><strong>M3U播放列表:</strong></div>';
			html += '<div class="url-item"><a href="http://' + lanIP + ':' + httpPort + '/iflv.m3u" target="_blank">http://' + lanIP + ':' + httpPort + '/iflv.m3u</a></div>';
			html += '</div>';
			
			return html;
		};
		
		// 增加CSS样式
		o = s.option(form.DummyValue, '_style');
		o.cfgvalue = function(section_id) {
			return E('style', {}, [
				`.proxy-status { margin-bottom: 15px; }
				.status-item { margin-bottom: 5px; display: flex; }
				.status-item .label { font-weight: bold; width: 100px; }
				.status-item .value { }
				.status-item .value.running { color: green; }
				.status-item .value.stopped { color: red; }
				.access-urls { margin-bottom: 15px; }
				.url-item { margin: 5px 0 10px 20px; }
				.url-item a { text-decoration: none; }`
			]);
		};
		
		// 辅助函数：格式化字节数
		function formatBytes(bytes, decimals = 2) {
			if (bytes === 0) return '0 B';
			
			const k = 1024;
			const dm = decimals < 0 ? 0 : decimals;
			const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
			
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			
			return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
		}
		
		return m.render();
	}
}); 