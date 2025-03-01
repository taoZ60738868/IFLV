'use strict';
'require view';

return view.extend({
	render: function() {
		return L.resolveDefault(L.ui.menu.findItem('admin/services/iflv/status'), {}).then(function(link) {
			if (link) {
				window.location.href = link.href;
			} else {
				return E('div', { class: 'cbi-section' }, 
					E('p', {}, _('导航到IFLV状态页面失败。'))
				);
			}
		});
	}
}); 