'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require fs';
'require network';

var callNetworkInterfaceStatus = rpc.declare({
	object: 'network.interface',
	method: 'status',
	params: ['interface'],
	expect: { 'interface': '' }
});

return view.extend({
	load: function() {
		return Promise.all([
			network.getNetworks(),
			network.getDevices(),
			uci.load('iflv')
		]);
	},

	render: function(data) {
		var m, s, o, ss;
		var networks = data[0];
		var devices = data[1];

		m = new form.Map('iflv', _('IFLV - 网口绑定'),
			_('配置IPTV网口绑定模式和相关接口参数。不同的绑定模式适用于不同的网络环境，请根据您的实际情况选择。'));

		s = m.section(form.TypedSection, 'globals', _('工作模式设置'));
		s.anonymous = true;

		// 工作模式选择
		o = s.option(form.ListValue, 'work_mode', _('网口绑定模式'));
		o.value('dual_line', _('双网线模式'));
		o.value('vlan', _('VLAN模式'));
		o.value('vlan_passthrough', _('VLAN透传模式'));
		o.default = 'dual_line';
		o.rmempty = false;
		o.description = _('双网线模式：需要两个物理网口分别连接到光猫IPTV口和机顶盒。<br>' +
						  'VLAN模式：仅需一个WAN口连接光猫，使用VLAN区分IPTV流量。<br>' +
						  'VLAN透传模式：仅需一个WAN口连接光猫，使用VLAN透传IPTV流量到内网。');

		// 网口设置部分
		s = m.section(form.TypedSection, 'interface', _('网口设置'));
		s.anonymous = true;
		s.addremove = false;

		// 光猫IPTV口（WAN口）
		o = s.option(form.ListValue, 'modem_port', _('光猫IPTV口'));
		o.depends('globals.work_mode', 'dual_line');
		o.description = _('选择连接光猫IPTV口的物理网口');
		o.load = function(section_id) {
			for (var i = 0; i < devices.length; i++) {
				if (devices[i].type == 'Network device') {
					this.value(devices[i].name, devices[i].name + (devices[i].macaddr ? ' (' + devices[i].macaddr + ')' : ''));
				}
			}
			return form.ListValue.prototype.load.apply(this, [section_id]);
		};

		// WAN接口选择（VLAN模式）
		o = s.option(form.ListValue, 'wan_interface', _('WAN接口'));
		o.depends('globals.work_mode', 'vlan');
		o.depends('globals.work_mode', 'vlan_passthrough');
		o.description = _('选择用于IPTV服务的WAN接口');
		o.load = function(section_id) {
			networks.forEach(n => {
				if (n.getName().includes('wan')) {
					this.value(n.getName(), n.getName() + ' (' + n.getProtocol() + ')');
				}
			});
			return form.ListValue.prototype.load.apply(this, [section_id]);
		};

		// VLAN ID
		o = s.option(form.Value, 'vlan_id', _('IPTV VLAN ID'));
		o.depends('globals.work_mode', 'vlan');
		o.depends('globals.work_mode', 'vlan_passthrough');
		o.datatype = 'range(1, 4094)';
		o.description = _('输入IPTV服务的VLAN ID（通常由运营商提供）');
		o.placeholder = '85';

		// 机顶盒口（LAN口）
		o = s.option(form.ListValue, 'stb_port', _('机顶盒口'));
		o.depends('globals.work_mode', 'dual_line');
		o.description = _('选择连接IPTV机顶盒的物理网口');
		o.load = function(section_id) {
			for (var i = 0; i < devices.length; i++) {
				if (devices[i].type == 'Network device') {
					this.value(devices[i].name, devices[i].name + (devices[i].macaddr ? ' (' + devices[i].macaddr + ')' : ''));
				}
			}
			return form.ListValue.prototype.load.apply(this, [section_id]);
		};

		// LAN接口选择（VLAN模式）
		o = s.option(form.ListValue, 'lan_interface', _('LAN接口'));
		o.depends('globals.work_mode', 'vlan');
		o.depends('globals.work_mode', 'vlan_passthrough');
		o.description = _('选择用于连接机顶盒的LAN接口');
		o.load = function(section_id) {
			networks.forEach(n => {
				if (n.getName().includes('lan')) {
					this.value(n.getName(), n.getName() + ' (' + n.getProtocol() + ')');
				}
			});
			return form.ListValue.prototype.load.apply(this, [section_id]);
		};

		// 内网VLAN ID（仅VLAN透传模式）
		o = s.option(form.Value, 'inner_vlan_id', _('内网VLAN ID'));
		o.depends('globals.work_mode', 'vlan_passthrough');
		o.datatype = 'range(1, 4094)';
		o.description = _('内网VLAN ID用于在LAN内标记IPTV流量');
		o.placeholder = '10';

		// 高级设置部分
		s = m.section(form.TypedSection, '_advanced', _('高级设置'));
		s.anonymous = true;
		s.addremove = false;

		// 应用配置按钮
		o = s.option(form.Button, '_apply', _('应用网络配置'));
		o.inputtitle = _('应用配置');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return m.save().then(function() {
				return fs.exec('/etc/init.d/iflv', ['restart']).then(function() {
					ui.addNotification(null, E('p', _('网络配置已应用，服务已重启')));
				}).catch(function(e) {
					ui.addNotification(null, E('p', _('应用配置失败: ') + e.message));
				});
			});
		};

		return m.render();
	}
}); 