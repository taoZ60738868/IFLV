'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require rpc';
'require poll';
'require dom';
'require uci';

// RPC调用
var callFileList = rpc.declare({
	object: 'file',
	method: 'list',
	params: ['path'],
	expect: { entries: [] }
});

var callFileRead = rpc.declare({
	object: 'file',
	method: 'read',
	params: ['path'],
	expect: { data: '' }
});

var callFileWrite = rpc.declare({
	object: 'file',
	method: 'write',
	params: ['path', 'data'],
	expect: { size: 0 }
});

var callChannelStatus = rpc.declare({
	object: 'iflv.channels',
	method: 'status',
	expect: { result: {} }
});

var callExportChannels = rpc.declare({
	object: 'iflv.channels',
	method: 'export',
	expect: { file: '' }
});

var callImportChannels = rpc.declare({
	object: 'iflv.channels',
	method: 'import',
	params: ['path'],
	expect: { result: false }
});

var callTestChannel = rpc.declare({
	object: 'iflv.channels',
	method: 'test',
	params: ['name'],
	expect: { result: false }
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('iflv'),
			callFileRead('/usr/share/iflv/channels.json').catch(function(err) {
				return '[]';
			})
		]);
	},

	render: function(data) {
		var m, s, o, ss;
		var channels = [];
		
		try {
			channels = JSON.parse(data[1]);
		} catch (e) {
			channels = [];
		}

		m = new form.Map('iflv', _('IFLV - EPG列表管理'),
			_('管理IPTV频道列表和EPG信息。您可以添加、编辑、删除频道，并导入导出频道列表。系统会定期检测频道可用性。'));
		
		// 通用设置
		s = m.section(form.TypedSection, 'epg', _('EPG更新设置'));
		s.anonymous = true;
		
		// 更新间隔
		o = s.option(form.Value, 'update_interval', _('EPG更新间隔（小时）'));
		o.datatype = 'uinteger';
		o.placeholder = '12';
		o.rmempty = false;
		
		// 主要EPG源
		o = s.option(form.ListValue, 'primary_source', _('主要EPG源'));
		o.value('default', _('默认来源'));
		o.value('epg1', _('来源1'));
		o.value('epg2', _('来源2'));
		o.value('epg3', _('来源3'));
		o.value('epg4', _('来源4'));
		o.value('epg5', _('来源5'));
		o.value('epg6', _('来源6'));
		o.rmempty = false;
		
		// 自动匹配
		o = s.option(form.Flag, 'auto_match', _('自动匹配频道'));
		o.default = '1';
		o.rmempty = false;
		
		// 立即更新按钮
		o = s.option(form.Button, '_update_now', _('立即更新EPG'));
		o.inputtitle = _('立即更新');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return fs.exec('/usr/bin/iflv_update_epg', []).then(function() {
				ui.addNotification(null, E('p', _('EPG更新已触发，请等待完成')));
			}).catch(function(e) {
				ui.addNotification(null, E('p', _('EPG更新触发失败: ') + e.message));
			});
		};
		
		// 频道管理
		s = m.section(form.GridSection, '_channels', _('频道列表'));
		s.anonymous = true;
		s.addremove = true;
		s.sortable = true;
		
		// 频道数据
		var channelData = [];
		channels.forEach(function(channel, index) {
			channelData.push({
				id: index,
				name: channel.name || '',
				alias: channel.alias || '',
				source: channel.source || '',
				urls: (channel.urls || []).join(','),
				status: 'unknown'
			});
		});
		
		// 表格字段
		
		// 频道名
		o = s.option(form.Value, 'name', _('频道名称'));
		o.editable = true;
		o.rmempty = false;
		
		// 别名
		o = s.option(form.Value, 'alias', _('频道别名'));
		o.editable = true;
		o.rmempty = true;
		
		// 来源
		o = s.option(form.Value, 'source', _('来源'));
		o.editable = true;
		o.rmempty = true;
		
		// 播放地址
		o = s.option(form.Value, 'urls', _('播放地址'));
		o.editable = true;
		o.rmempty = false;
		o.description = _('多个地址用逗号分隔');
		
		// 状态
		o = s.option(form.DummyValue, 'status', _('状态'));
		o.rawhtml = true;
		o.cfgvalue = function(section_id) {
			return '<div id="status_' + section_id + '" class="channel-status">未知</div>';
		};
		
		// 测试按钮
		o = s.option(form.Button, '_test', _('测试'));
		o.editable = true;
		o.inputtitle = _('测试');
		o.inputstyle = 'action';
		o.onclick = function(section_id) {
			var channelName = channelData[section_id].name;
			var statusEl = document.getElementById('status_' + section_id);
			
			if (statusEl) {
				statusEl.textContent = '测试中...';
				statusEl.className = 'channel-status testing';
			}
			
			return callTestChannel(channelName).then(function(res) {
				if (statusEl) {
					if (res.result) {
						statusEl.textContent = '可用';
						statusEl.className = 'channel-status available';
					} else {
						statusEl.textContent = '不可用';
						statusEl.className = 'channel-status unavailable';
					}
				}
			}).catch(function(err) {
				if (statusEl) {
					statusEl.textContent = '测试失败';
					statusEl.className = 'channel-status error';
				}
			});
		};
		
		// 表格数据
		s.load = function() {
			return Promise.resolve(channelData);
		};
		
		// 保存数据
		s.save = function() {
			var updatedChannels = [];
			
			// 收集更新后的数据
			for (var i = 0; i < channelData.length; i++) {
				var channel = channelData[i];
				updatedChannels.push({
					name: channel.name,
					alias: channel.alias,
					source: channel.source,
					urls: channel.urls.split(',').map(function(url) { return url.trim(); })
				});
			}
			
			return callFileWrite('/usr/share/iflv/channels.json', JSON.stringify(updatedChannels, null, 2)).then(function() {
				ui.addNotification(null, E('p', _('频道列表已保存')));
				return fs.exec('/etc/init.d/iflv', ['restart']).then(function() {
					ui.addNotification(null, E('p', _('服务已重启以应用新配置')));
				});
			}).catch(function(err) {
				ui.addNotification(null, E('p', _('保存频道列表失败: ') + err.message));
			});
		};
		
		// 导入导出部分
		s = m.section(form.TypedSection, '_io', _('导入导出'));
		s.anonymous = true;
		
		// 导出按钮
		o = s.option(form.Button, '_export', _('导出频道列表'));
		o.inputtitle = _('导出');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return callExportChannels().then(function(res) {
				var filename = res.file || '/tmp/iflv_channels_export.json';
				window.open('/cgi-bin/luci/admin/system/iflv/download/' + encodeURIComponent(filename));
				ui.addNotification(null, E('p', _('频道列表已导出')));
			}).catch(function(err) {
				ui.addNotification(null, E('p', _('导出频道列表失败: ') + err.message));
			});
		};
		
		// 导入文件
		o = s.option(form.FileUpload, 'importfile', _('选择文件'));
		o.root_directory = '/tmp';
		o.datatype = 'file';
		
		// 导入按钮
		o = s.option(form.Button, '_import', _('导入频道列表'));
		o.inputtitle = _('导入');
		o.inputstyle = 'apply';
		o.onclick = function(section_id) {
			var fileInput = document.querySelector('input[name="importfile"]');
			if (!fileInput || !fileInput.value) {
				ui.addNotification(null, E('p', _('请先选择要导入的文件')));
				return;
			}
			
			var filePath = '/tmp/' + fileInput.value;
			return callImportChannels(filePath).then(function(res) {
				if (res.result) {
					ui.addNotification(null, E('p', _('频道列表已导入，即将刷新页面')));
					window.setTimeout(function() {
						window.location.reload();
					}, 2000);
				} else {
					ui.addNotification(null, E('p', _('导入频道列表失败')));
				}
			}).catch(function(err) {
				ui.addNotification(null, E('p', _('导入频道列表失败: ') + err.message));
			});
		};
		
		// 增加CSS样式
		o = s.option(form.DummyValue, '_style');
		o.cfgvalue = function(section_id) {
			return E('style', {}, [
				`.channel-status { padding: 2px 6px; border-radius: 4px; display: inline-block; }
				.channel-status.available { background-color: #4cd964; color: white; }
				.channel-status.unavailable { background-color: #ff3b30; color: white; }
				.channel-status.testing { background-color: #f0f0f0; color: #666; }
				.channel-status.error { background-color: #ff9500; color: white; }`
			]);
		};
		
		return m.render();
	}
}); 