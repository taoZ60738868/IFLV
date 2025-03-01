'use strict';
'require view';
'require fs';
'require ui';
'require rpc';
'require form';
'require poll';

var callLogRead = rpc.declare({
	object: 'iflv.log',
	method: 'read',
	params: ['lines'],
	expect: { lines: [] }
});

var callLogClear = rpc.declare({
	object: 'iflv.log',
	method: 'clear',
	expect: { result: false }
});

var callDiagnostics = rpc.declare({
	object: 'iflv.log',
	method: 'diagnostics',
	expect: { result: {} }
});

return view.extend({
	render: function() {
		var logContainer = E('div', { 'class': 'iflv-log-container' });
		var diagContainer = E('div', { 'class': 'iflv-diag-container' });
		
		// 创建主容器
		var view = E('div', {}, [
			// 日志工具栏
			E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('IFLV - 系统日志')),
				E('div', { 'class': 'cbi-map-descr' }, _('查看IFLV运行日志和诊断信息。系统会自动分析日志中的异常并提供可能的解决方案。')),
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'cbi-section-node' }, [
						E('div', { 'class': 'iflv-log-toolbar' }, [
							E('div', { 'class': 'left' }, [
								E('button', {
									'class': 'cbi-button cbi-button-apply',
									'click': ui.createHandlerFn(this, function() {
										updateLogAndDiagnostics();
									})
								}, [ _('刷新') ]),
								' ',
								E('button', {
									'class': 'cbi-button cbi-button-remove',
									'click': ui.createHandlerFn(this, function() {
										ui.showModal(_('清空日志'), [
											E('p', _('确定要清空系统日志吗？此操作不可恢复。')),
											E('div', { 'class': 'right' }, [
												E('button', {
													'class': 'btn',
													'click': ui.hideModal
												}, [ _('取消') ]),
												' ',
												E('button', {
													'class': 'btn cbi-button-negative',
													'click': ui.createHandlerFn(this, function() {
														ui.hideModal();
														clearLog();
													})
												}, [ _('清空') ])
											])
										]);
									})
								}, [ _('清空') ]),
								' ',
								E('button', {
									'class': 'cbi-button cbi-button-action',
									'click': ui.createHandlerFn(this, function() {
										runDiagnostics();
									})
								}, [ _('运行诊断') ])
							]),
							E('div', { 'class': 'right' }, [
								E('label', { 'for': 'log_lines', 'style': 'margin-right: 5px;' }, _('显示行数:')),
								E('select', {
									'id': 'log_lines',
									'class': 'cbi-input-select',
									'change': ui.createHandlerFn(this, function(ev) {
										updateLog(ev.target.value);
									})
								}, [
									E('option', { 'value': '50', 'selected': 'selected' }, '50'),
									E('option', { 'value': '100' }, '100'),
									E('option', { 'value': '200' }, '200'),
									E('option', { 'value': '500' }, '500'),
									E('option', { 'value': '1000' }, '1000')
								]),
								' ',
								E('label', {
									'class': 'cbi-input-checkbox',
									'style': 'margin-left: 10px;'
								}, [
									E('input', {
										'id': 'auto_refresh',
										'type': 'checkbox',
										'checked': 'checked',
										'change': ui.createHandlerFn(this, function(ev) {
											if (ev.target.checked) {
												startPolling();
											} else {
												stopPolling();
											}
										})
									}),
									' ',
									_('自动刷新')
								])
							])
						]),
						E('hr'),
						E('h3', {}, _('系统日志')),
						E('div', { 'class': 'iflv-log-outer' }, [
							logContainer
						]),
						E('h3', { 'style': 'margin-top: 20px;' }, _('诊断信息')),
						E('div', { 'class': 'iflv-diag-outer' }, [
							diagContainer
						])
					])
				])
			]),
			// 添加样式
			E('style', {}, [
				'.iflv-log-toolbar { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }',
				'.iflv-log-toolbar .left, .iflv-log-toolbar .right { display: flex; align-items: center; }',
				'.iflv-log-outer { background-color: #f9f9f9; padding: 10px; border-radius: 5px; max-height: 500px; overflow-y: auto; }',
				'.iflv-log-container { font-family: monospace; white-space: pre-wrap; }',
				'.iflv-log-container .log-entry { margin-bottom: 2px; }',
				'.iflv-log-container .log-entry .timestamp { color: #666; }',
				'.iflv-log-container .log-entry.error { color: #ff3b30; }',
				'.iflv-log-container .log-entry.warn { color: #ff9500; }',
				'.iflv-log-container .log-entry.info { color: #000000; }',
				'.iflv-log-container .log-entry.debug { color: #8e8e93; }',
				'.iflv-diag-outer { background-color: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 10px; }',
				'.iflv-diag-container .diag-item { margin-bottom: 10px; padding: 10px; border-radius: 5px; }',
				'.iflv-diag-container .diag-item.error { background-color: #fef0f0; border-left: 4px solid #ff3b30; }',
				'.iflv-diag-container .diag-item.warn { background-color: #fff8f0; border-left: 4px solid #ff9500; }',
				'.iflv-diag-container .diag-item.info { background-color: #f0f8ff; border-left: 4px solid #007aff; }',
				'.iflv-diag-container .diag-item .diag-title { font-weight: bold; margin-bottom: 5px; }',
				'.iflv-diag-container .diag-item .diag-desc { margin-bottom: 5px; }',
				'.iflv-diag-container .diag-item .diag-solution { margin-top: 5px; font-style: italic; }'
			])
		]);
		
		// 获取日志并更新显示
		function updateLog(lines) {
			lines = lines || 50;
			
			return callLogRead(lines).then(function(result) {
				var logLines = result.lines || [];
				var logHtml = '';
				
				if (logLines.length === 0) {
					logHtml = _('暂无日志记录');
				} else {
					for (var i = 0; i < logLines.length; i++) {
						var logLine = logLines[i];
						var levelClass = '';
						
						if (logLine.match(/\[error\]/i)) {
							levelClass = 'error';
						} else if (logLine.match(/\[warn\]/i)) {
							levelClass = 'warn';
						} else if (logLine.match(/\[info\]/i)) {
							levelClass = 'info';
						} else if (logLine.match(/\[debug\]/i)) {
							levelClass = 'debug';
						}
						
						// 替换日期和级别为带样式的元素
						var formattedLine = logLine.replace(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]+)\]/, 
							'<span class="timestamp">$1</span> <span class="level">[$2]</span>');
						
						logHtml += '<div class="log-entry ' + levelClass + '">' + formattedLine + '</div>';
					}
				}
				
				dom.content(logContainer, logHtml);
				
				// 自动滚动到底部
				var logOuter = document.querySelector('.iflv-log-outer');
				if (logOuter) {
					logOuter.scrollTop = logOuter.scrollHeight;
				}
				
				return logLines;
			});
		}
		
		// 清空日志
		function clearLog() {
			return callLogClear().then(function(result) {
				if (result.result) {
					ui.addNotification(null, E('p', _('日志已清空')));
					updateLog();
				} else {
					ui.addNotification(null, E('p', _('清空日志失败')));
				}
			}).catch(function(err) {
				ui.addNotification(null, E('p', _('清空日志失败: ') + err.message));
			});
		}
		
		// 运行诊断并更新显示
		function runDiagnostics() {
			return callDiagnostics().then(function(result) {
				updateDiagnostics(result.result || {});
			}).catch(function(err) {
				ui.addNotification(null, E('p', _('运行诊断失败: ') + err.message));
			});
		}
		
		// 更新诊断显示
		function updateDiagnostics(diagResults) {
			var items = diagResults.items || [];
			var diagHtml = '';
			
			if (items.length === 0) {
				diagHtml = '<div class="diag-item info"><div class="diag-title">' + _('系统状态正常') + '</div><div class="diag-desc">' + _('未发现任何问题') + '</div></div>';
			} else {
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					diagHtml += '<div class="diag-item ' + item.level + '">';
					diagHtml += '<div class="diag-title">' + item.title + '</div>';
					diagHtml += '<div class="diag-desc">' + item.description + '</div>';
					
					if (item.solution) {
						diagHtml += '<div class="diag-solution">' + _('建议解决方案: ') + item.solution + '</div>';
					}
					
					diagHtml += '</div>';
				}
			}
			
			dom.content(diagContainer, diagHtml);
		}
		
		// 同时更新日志和诊断
		function updateLogAndDiagnostics() {
			var lines = document.getElementById('log_lines') ? document.getElementById('log_lines').value : '50';
			updateLog(lines);
			runDiagnostics();
		}
		
		// 轮询更新
		var pollHandler = null;
		
		function startPolling() {
			stopPolling();
			pollHandler = poll.add(function() {
				var lines = document.getElementById('log_lines') ? document.getElementById('log_lines').value : '50';
				return updateLog(lines);
			}, 5);
		}
		
		function stopPolling() {
			if (pollHandler !== null) {
				poll.remove(pollHandler);
				pollHandler = null;
			}
		}
		
		// 初始加载
		updateLogAndDiagnostics();
		startPolling();
		
		return view;
	},
	
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
}); 