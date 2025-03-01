'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require form';
'require fs';

// RPC调用
const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

// 获取服务状态
function getServiceStatus() {
	return L.resolveDefault(callServiceList('iflv'), {}).then(function(res) {
		var isRunning = false;
		try {
			isRunning = res['iflv']['instances']['iflv']['running'];
		} catch (e) {
			isRunning = false;
		}
		return isRunning;
	});
}

// 读取状态信息
function getStatusInfo() {
	return L.resolveDefault(fs.read('/var/run/iflv_status.json'), '{}').then(function(res) {
		try {
			return JSON.parse(res);
		} catch (e) {
			return {};
		}
	});
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('iflv', _('IFLV - IPTV转发系统'),
			_('IFLV是一个智能IPTV转发系统，可将IPTV组播信号转为单播，实现内网所有设备访问同一地址观看直播和回放。'));

		s = m.section(form.TypedSection, 'globals', _('运行状态'));
		s.anonymous = true;

		// 服务状态
		o = s.option(form.DummyValue, '_service_status', _('服务状态'));
		o.cfgvalue = function(section_id) {
			return E('div', { 'id': 'service_status', 'class': 'alert-message' }, [ 
				E('em', _('获取中...'), [])
			]);
		};
		o.load = function() {
			poll.add(function() {
				return getServiceStatus().then(function(running) {
					var statusEl = document.getElementById('service_status');
					if (statusEl) {
						if (running) {
							dom.content(statusEl, [
								E('em', { 'class': 'spinning', 'style': 'color:green;' }, [ _('运行中') ])
							]);
						} else {
							dom.content(statusEl, [
								E('em', { 'style': 'color:red;' }, [ _('已停止') ])
							]);
						}
					}
				});
			});
		};

		// 网口状态
		o = s.option(form.DummyValue, '_ports_status', _('网口状态'));
		o.cfgvalue = function(section_id) {
			return E('div', { 'id': 'ports_status', 'class': 'alert-message' }, [
				E('em', _('获取中...'), [])
			]);
		};
		o.load = function() {
			poll.add(function() {
				return getStatusInfo().then(function(info) {
					var portsStatus = document.getElementById('ports_status');
					if (portsStatus) {
						var modemStatus = info.modem_port_status || 'unknown';
						var stbStatus = info.stb_port_status || 'unknown';

						var html = '<div class="port-status-container">';
						html += '<div class="port-item"><strong>光猫IPTV口:</strong> ';
						
						if (modemStatus === 'connected') {
							html += '<span style="color:green;">已连接</span>';
						} else if (modemStatus === 'disconnected') {
							html += '<span style="color:red;">未连接</span>';
						} else {
							html += '<span style="color:orange;">未知</span>';
						}
						
						html += '</div>';
						html += '<div class="port-item"><strong>机顶盒口:</strong> ';
						
						if (stbStatus === 'connected') {
							html += '<span style="color:green;">已连接</span>';
						} else if (stbStatus === 'disconnected') {
							html += '<span style="color:red;">未连接</span>';
						} else {
							html += '<span style="color:orange;">未知</span>';
						}
						
						html += '</div>';
						html += '</div>';
						
						dom.content(portsStatus, E('div', {}, [ html ]));
					}
				});
			});
		};

		// 频道信息
		o = s.option(form.DummyValue, '_channels_info', _('频道信息'));
		o.cfgvalue = function(section_id) {
			return E('div', { 'id': 'channels_info', 'class': 'alert-message' }, [
				E('em', _('获取中...'), [])
			]);
		};
		o.load = function() {
			poll.add(function() {
				return getStatusInfo().then(function(info) {
					var channelsInfo = document.getElementById('channels_info');
					if (channelsInfo) {
						var totalChannels = info.total_channels || 0;
						var availableChannels = info.available_channels || 0;
						
						var html = '<div class="channel-info-container">';
						html += '<div><strong>频道总数:</strong> ' + totalChannels + '</div>';
						html += '<div><strong>可用频道:</strong> ' + availableChannels + '</div>';
						html += '<div class="channel-progress">';
						html += '<div class="channel-progress-bar" style="width: ' + (totalChannels > 0 ? (availableChannels / totalChannels * 100) : 0) + '%"></div>';
						html += '</div>';
						html += '</div>';
						
						dom.content(channelsInfo, E('div', {}, [ html ]));
					}
				});
			});
		};

		// 快捷设置部分
		s = m.section(form.TypedSection, 'globals', _('快捷设置'));
		s.anonymous = true;

		// 启用/禁用服务
		o = s.option(form.Button, '_toggle_service', _('服务控制'));
		o.render = function(section_id) {
			var btn = E('button', {
				'class': 'btn cbi-button cbi-button-apply',
				'id': 'btn_toggle_service',
				'click': ui.createHandlerFn(this, function(section_id) {
					return getServiceStatus().then(function(running) {
						var action = running ? 'stop' : 'start';
						return fs.exec('/etc/init.d/iflv', [action]).then(function() {
							var btnEl = document.getElementById('btn_toggle_service');
							if (btnEl) {
								if (action === 'start') {
									btnEl.textContent = _('停止服务');
									btnEl.className = 'btn cbi-button cbi-button-remove';
								} else {
									btnEl.textContent = _('启动服务');
									btnEl.className = 'btn cbi-button cbi-button-apply';
								}
							}
							ui.addNotification(null, E('p', _('服务已' + (action === 'start' ? '启动' : '停止'))));
						}).catch(function(err) {
							ui.addNotification(null, E('p', _('出错了: ') + err.message));
						});
					});
				})
			}, [ _('获取中...') ]);

			poll.add(function() {
				return getServiceStatus().then(function(running) {
					if (running) {
						btn.textContent = _('停止服务');
						btn.className = 'btn cbi-button cbi-button-remove';
					} else {
						btn.textContent = _('启动服务');
						btn.className = 'btn cbi-button cbi-button-apply';
					}
				});
			});

			return E('div', {}, [ btn ]);
		};

		// IPTV服务商选择
		o = s.option(form.ListValue, 'iptv_provider', _('IPTV服务商'));
		o.value('china_telecom', _('中国电信'));
		o.value('china_unicom', _('中国联通'));
		o.value('china_mobile', _('中国移动'));
		o.value('custom', _('自定义'));
		o.rmempty = false;

		// IPTV地区选择
		o = s.option(form.ListValue, 'iptv_region', _('IPTV地区'));
		o.value('beijing', _('北京'));
		o.value('shanghai', _('上海'));
		o.value('guangdong', _('广东'));
		o.value('jiangsu', _('江苏'));
		o.value('zhejiang', _('浙江'));
		o.value('sichuan', _('四川'));
		o.value('hubei', _('湖北'));
		o.value('shandong', _('山东'));
		o.value('custom', _('自定义'));
		o.rmempty = false;

		// 立即抓包分析按钮
		o = s.option(form.Button, '_analyze_now', _('立即抓包分析'));
		o.render = function(section_id) {
			return E('button', {
				'class': 'btn cbi-button cbi-button-action',
				'click': ui.createHandlerFn(this, function(section_id) {
					return fs.exec('/usr/bin/iflv_trigger_analyze', []).then(function() {
						ui.addNotification(null, E('p', _('已触发抓包分析，请等待完成')));
					}).catch(function(err) {
						ui.addNotification(null, E('p', _('抓包分析触发失败: ') + err.message));
					});
				})
			}, [ _('立即分析') ]);
		};

		// 增加CSS样式
		o = s.option(form.DummyValue, '_style');
		o.cfgvalue = function(section_id) {
			return E('style', {}, [
				`.port-status-container { display: flex; flex-direction: column; gap: 10px; }
				.port-item { display: flex; align-items: center; }
				.channel-info-container { margin-top: 10px; }
				.channel-progress { height: 20px; background-color: #f0f0f0; border-radius: 4px; margin-top: 5px; overflow: hidden; }
				.channel-progress-bar { height: 100%; background-color: #4cd964; transition: width 0.3s ease; }`
			]);
		};

		return m.render();
	}
}); 