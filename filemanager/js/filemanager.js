/*********************************************************************************************************
 This code is part of the FileManager software (www.gerd-tentler.de/tools/filemanager), copyright by
 Gerd Tentler. Obtain permission before selling this code or hosting it on a commercial website or
 redistributing it over the Internet or in any other medium. In all cases copyright must remain intact.
*********************************************************************************************************/

var fmLib = {

	fadeSpeed: 15, // fade speed (0 - 30; 0 = no fading)
	mouseX: 0,
	mouseY: 0,
	fadeTimer: 0,
	fileIv: 0,
	mpIv: 0,
	opacity: 0,
	dragging: false,
	noMenu: false,
	useRightClickMenu: {},
	isResized: {},
	resizeTimeout: null,
	browserContextMenu: true,
	dialog: null,
	progBar: null,
	fdObj: {},
	refreshIv: {},
	useFlash: false,
	inputFocus: false,
	curCont1: null,

	callSave: function(msg, url, frmName) {
		// called when save button(s) in the edit dialog is clicked
		var ok = true; //var ok = window.confirm(msg);
		if(ok) {
			if(url) this.call(url, frmName);
			else if(frmName) {
				var fmEditorChange = $$('fmEditorChange');
				if(fmEditorChange) fmEditorChange.innerHTML = '';
				document.forms[frmName].submit();
			}
		}
		var fmEditorButton1 = $$('fmEditorButton1');
		if(fmEditorButton1) {
			fmEditorButton1.classList.add('ui-state-default');
			fmEditorButton1.classList.remove('ui-state-hover');
			setTimeout(function() {
				fmEditorButton1.classList.remove('ui-state-active');
			}, 500);
		}
	},

	closeEdit: function(opacity, dialog) {
		//called when close button in the edit dialog is clicked
		var fmEditorChange = $$('fmEditorChange');
		if(fmEditorChange && fmEditorChange.innerHTML != '') {
			var msg = 'File is not saved. Continue?';
			var lang = fmContSettings[this.curCont1].language;
			msg = fmContSettings[lang].msgSaveFile;
			var ok = window.confirm(msg);
			if(!ok) return false;
		}

		var fmEditorSaveButton = $$('fmEditorSaveButton');
		if(fmEditorSaveButton) fmEditorSaveButton.style.visibility = 'hidden';

		this.fadeOut(opacity, dialog, true); // force modal close

		var fmOverlay = $$('fmOverlay');
		if(fmOverlay) fmOverlay.style.display = 'none';
	},

	call: function(url, frmName) {
		url.match(/fmContainer=(\w+)/);
		var curCont = RegExp.$1;
		var ajaxObj = new ajax();

		if(this.dialog && this.opacity) this.fadeOut(this.opacity, this.dialog);

		if(url.match('fmMode=edit')) {
			ajaxObj.makeRequest(url, function() {
				var contObj = $$('fmEditorCont');

				if(contObj) {
					fmParser.parseEditor(ajaxObj.response, contObj);
					fmLib.initEditor(contObj);
				}
			});
		}
		else if(url.match('fmMode=readTextFile')) {
			ajaxObj.makeRequest(url, function() {
				var contObj = $$('fmTextViewerCont');

				if(contObj) {
					fmParser.parseTextViewer(ajaxObj.response, contObj);
					fmLib.initTextViewer(contObj);
				}
			});
		}
		else {
			var listCont = $$(curCont + 'List');
			if(listCont) {
				var listLoad;
				var fmCont = $$(curCont);

				if(fmCont) listLoad = this.viewLoader(fmCont, url);

				ajaxObj.makeRequest(url, function() {
					if(ajaxObj.query.match(/fmMode=toggleDeleted/)) {
						fmContSettings[curCont].viewDeleted = !fmContSettings[curCont].viewDeleted;
					}
					fmLib.viewResponse(ajaxObj.response, curCont, listLoad);
				}, frmName);
			}
		}
	},

	checkFile: function(listLoad, sid, curCont) {
		var iFrame = frames.fmFileAction;

		if(iFrame && iFrame.document) {
			var url = iFrame.document.location.href;
			var response = iFrame.document.body.innerHTML;

			if(response.match(/end:1\}$/)) {
				if(this.fileIv) clearInterval(this.fileIv);
				iFrame.document.body.innerHTML = '';
				this.viewResponse(response, curCont, listLoad);

				if(this.progBar) {
					this.fadeOut(this.opacity, this.progBar);
					this.progBar = null;
				}
			}
			else if(sid) {
				var ajaxObj = new ajax();
				ajaxObj.noWarning = true;
				url = fmWebPath + '/cgi/ping.pl?sid=' + sid + '&tmp=' + fmContSettings[curCont].tmp;

				ajaxObj.makeRequest(url, function() {
					if(ajaxObj.response) {
						var json = eval('(' + ajaxObj.response + ')');

						if(json.bytesTotal > 0) {
							var pbContent = fmLib.drawProgBar(json);

							if(!fmLib.progBar) {
								fmLib.viewProgress(pbContent);
							}
							else $$('fmProgressText').innerHTML = pbContent;
						}
					}
				});
			}
		}
	},

	getFile: function(curCont, id) {
		var url = '?action&fmContainer=' + curCont + '&fmMode=getFile&fmObject=' + id;
		var link = document.createElement('a');
		link.href = url;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		this.fadeOut(this.opacity, this.dialog);
	},

	drawProgBar: function(json) {
		if(typeof json != 'object') return false;
		var div, unit;

		if(json.bytesTotal > 1024 * 1024) {
			div = 1024 * 1024;
			unit = 'M';
		}
		else {
			div = 1024;
			unit = 'K';
		}
		var percent = (json.bytesTotal > 0) ? Math.round(json.bytesCurrent * 100 / json.bytesTotal) : 0;
		var current = fmTools.numberFormat(json.bytesCurrent / div, 2);
		var total = fmTools.numberFormat(json.bytesTotal / div, 2);
		var s = json.timeCurrent - json.timeStart;
		var bps = fmTools.numberFormat(json.bytesCurrent / 1024 / (s ? s : 1), 2);
		if(bps > 1024) bps = fmTools.numberFormat(bps / 1024, 2) + ' M/sec';
		else bps += ' K/sec';
		var h = Math.floor(s / 3600);
		s -= h * 3600;
		var m = Math.floor(s / 60);
		s -= m * 60;
		if(h < 10) h = '0' + h;
		if(m < 10) m = '0' + m;
		if(s < 10) s = '0' + s;

		html = '<table border="0" cellspacing="0" cellpadding="4" width="100%"><tr>';
		html += '<td colspan="2" align="center">';
		html += '<div class="fmProgressBarText" style="width:200px; margin-bottom:8px; overflow:hidden">' + json.filename + '</div>';
		html += '<div class="fmProgressBarBG" style="width:202px">';
		if(percent) html += '<div class="fmProgressBar" style="width:' + (percent * 2) + 'px">&nbsp;</div>';
		else html += '&nbsp;';
		html += '</div>';
		html += '</td>';
		html += '</tr><tr>';
		html += '<td class="fmProgressBarText" align="left">' + current + ' ' + unit + ' / ' + total + ' ' + unit + ' (' + percent + '%)</td>';
		html += '<td class="fmProgressBarText" align="right">' + bps + '</td>';
		html += '</tr><tr>';
		html += '<td class="fmProgressBarText" align="center" colspan="2">' + h + ':' + m + ':' + s + '</td>';
		html += '</tr></table>';
		return html;
	},

	viewLoader: function(fmCont, url) {
		var listLoad = document.createElement('div');
		this.setOpacity(50, listLoad);
		listLoad.style.position = 'absolute';
		listLoad.style.left = 0;
		listLoad.style.top = 0;
		listLoad.style.padding = 0;
		//listLoad.style.backgroundColor = '#000';
		listLoad.style.width = fmCont.offsetWidth + 'px';
		listLoad.style.height = fmCont.offsetHeight + 'px';
		listLoad.style.display = 'block';
		listLoad.style.zIndex = 68; //MP check this
		fmCont.appendChild(listLoad);

		var i = document.createElement('i');
		i.className = 'fmIconSpinner fmIcon_large fmIcon_centered';
		listLoad.appendChild(i);
		return listLoad;
	},

	viewResponse: function(json, curCont, listLoad, keepDialog) {
		var fmCont = $$(curCont);
		var titleCont = $$(curCont + 'Title');
		var listCont = $$(curCont + 'List');
		var logCont = $$(curCont + 'Log');
		var infoCont = $$(curCont + 'Info');

		if(typeof json != 'object') {
			if(json.match(/\{.+\}$/)) json = eval('(' + json + ')');
		}

		if(typeof json == 'object') {
			this.sortJson(json);
			fmContSettings[curCont].listJson = json;
			if(json.reloadExplorer != -1) fmContSettings[curCont].expJson = null;
			if(!json.login) this.getExplorer(curCont, '', '', json.reloadExplorer);
			if(titleCont) fmParser.parseTitle(json, titleCont);
			if(listCont) fmParser.parseMain(json, listCont);
			if(logCont) fmParser.parseLogMessages(json, logCont);
			if(infoCont) fmParser.parseDebugInfo(json, infoCont);
			if(json.error) this.viewError(json.error, curCont);
		}
		if(listLoad && fmCont) fmCont.removeChild(listLoad);

		if(!keepDialog && this.opacity && this.dialog) {
			this.fadeOut(this.opacity, this.dialog);
		}
	},

	cmGetMode: function(ext) {
		switch(ext) {
			case 'php':
			case 'module':
			case 'inc':
				return 'application/x-httpd-php';
			case 'js':
				return 'text/javascript';
			case 'html':
			case 'htm':
			case 'latte':
			case 'smarty':
			case 'twig':
				return 'text/html';
			case 'css':
				return 'text/css';
			case 'sql':
				return 'text/x-mysql';
			case 'md':
			case 'markdown':
				return 'text/x-markdown';
			case 'xml':
				return 'application/xml';
			default:
				return 'text/plain';
		};
	},

	initEditor: function(contObj) {
		var elem = contObj.getElementsByTagName('textarea')[0];
		if(!elem) alert('editor textarea not defined');

		//MP first classname is codeeditor, the second one is file extension
		var mode = this.cmGetMode(elem.classList[1]);

		window.editor = CodeMirror.fromTextArea(elem, {
			theme: 'default',
			lineNumbers: true,
			mode: mode,
			indentUnit: 4,
			indentWithTabs: true,
			styleActiveLine: true,
			matchBrackets: true,
			lineWrapping: false,
			foldGutter: true,
			gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
			extraKeys: {
				'Ctrl-S': function(cm) {
					fmLib.callSave(fmMsg[lang].msgSaveFile, '', 'frmEdit');
				},
				'Esc': function(cm) {
					fmLib.closeEdit(fmLib.opacity, fmLib.dialog);
				}
			}
		});

		// set the dimensions of the editor to the dimensions of the container
		elem = $$('fmEditorCont');
		window.editor.setSize(elem.clientWidth, elem.clientHeight);

		// make the table td with the save button visible again, it was hidden to prevent jumping
		$$('fmEditorSaveButton').style.visibility = 'visible';

		// remove the styles left from previos opened editor
		var fmEditorButton1 = $$('fmEditorButton1'); // the bottom save button
		if(fmEditorButton1) {
			fmEditorButton1.classList.remove('ui-state-active');
			fmEditorButton1.classList.remove('ui-state-hover');
			fmEditorButton1.classList.add('ui-state-default');
		}

		document.getElementById('fmEditorChange').innerHTML = ''; // change indicator
		window.editor.on('change', function() {
			document.getElementById('fmEditorChange').innerHTML = '<i class="fmIconSaveIndicator"></i>';
		});

	},

	initTextViewer: function(contObj) {
		var elem = contObj.getElementsByTagName('textarea')[0];
		if(!elem) alert('textarea not defined');

		//MP first classname is codeeditor, the second one is file extension
		var mode = this.cmGetMode(elem.classList[1]);

		window.editor1 = CodeMirror.fromTextArea(elem, {
			theme: 'default',
			lineNumbers: true,
			mode: mode,
			indentUnit: 4,
			indentWithTabs: true,
			styleActiveLine: true,
			matchBrackets: true,
			lineWrapping: false,
			foldGutter: true,
			gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
			readOnly: true
		});

		// set the dimensions of the editor to the dimensions of the container
		elem = $$('fmDocViewerCont');
		window.editor1.setSize(elem.clientWidth, elem.clientHeight);
	},

	initFileManager: function(url, mode) {
		var ajaxObj = new ajax();
		url.match(/fmContainer=(\w+)/);
		var curCont = RegExp.$1;

		if(this.isResized[curCont]) return false;
		this.isResized[curCont] = true;

		if(!fmContSettings[curCont]) {
			ajaxObj.makeRequest(url + '&fmMode=getContSettings', function() {
				if(!ajaxObj.response) {
					alert('ERROR: Could not load settings!');
					return false;
				}
				fmContSettings[curCont] = eval('(' + ajaxObj.response + ')');
				fmLib.useRightClickMenu[curCont] = (fmContSettings[curCont].useRightClickMenu && !OP);

				if(fmLib.useRightClickMenu[curCont]) {
					document.oncontextmenu = function(e) {
						if(!e) e = window.event;
						e.cancelBubble = true;
						if(e.stopPropagation) e.stopPropagation();
						return fmLib.browserContextMenu;
					}
				}
					//MP what is this?
					//document.oncontextmenu = function(e) {
					//	if(!e) e = window.event;
					//	e.cancelBubble = true;
					//	if(e.stopPropagation) e.stopPropagation();
					//	return fmLib.browserContextMenu;
					//}

				if(fmContSettings[curCont].smartRefresh > 0) {
					if(fmLib.refreshIv[curCont]) clearInterval(fmLib.refreshIv[curCont]);
					fmLib.refreshIv[curCont] = setInterval(function() {
						var json = fmContSettings[curCont].listJson;
						if(!json || json.login) return false;

						ajaxObj.makeRequest(url + '&fmMode=checkUpdate', function() {
							if(ajaxObj.response != -1) {
								fmLib.call(url + '&fmMode=refresh&fmObject=' + ajaxObj.response);
							}
						});
						return true;
					}, fmContSettings[curCont].smartRefresh * 1000);
				}
				var doResize = fmLib.setFileManagerSize(curCont);

				if(!fmContSettings[curCont].userPerms) {
					ajaxObj.makeRequest(url + '&fmMode=getUserPerms', function() {
						if(!ajaxObj.response) {
							alert('ERROR: Could not load permissions!');
							return false;
						}
						fmContSettings[curCont].userPerms = eval('(' + ajaxObj.response + ')');

						if(!fmMsg[fmContSettings[curCont].language]) {
							fmMsg[fmContSettings[curCont].language] = {};

							ajaxObj.makeRequest(url + '&fmMode=getMessages', function() {
								if(!ajaxObj.response) {
									alert('ERROR: Could not load messages!');
									return false;
								}
								fmMsg[fmContSettings[curCont].language] = eval('(' + ajaxObj.response + ')');
								fmTools.touchScroll('fmExplorerText2');

								//set default labels and buttons
								var lang = fmContSettings[curCont].language;
								$$('fmSearchLabel').innerHTML = fmMsg[lang].fmSearchLabel;
								$$('fmSearchButton').value = fmMsg[lang].fmSearchButton;
								$$('fmCreateFileLabel').innerHTML = fmMsg[lang].fmCreateFileLabel;
								$$('fmCreateFileButton').value = fmMsg[lang].fmCreateFileButton;
								$$('fmNewDirLabel').innerHTML = fmMsg[lang].fmNewDirLabel;
								$$('fmNewDirButton').value = fmMsg[lang].fmNewDirButton;
								$$('fmNewFileLabel').innerHTML = fmMsg[lang].fmNewFileLabel;
								$$('fmNewFileButton').value = fmMsg[lang].fmNewFileButton;
								$$('fmPermLabel').innerHTML = fmMsg[lang].fmPermLabel;
								$$('fmPermButton').value = fmMsg[lang].fmPermButton;
								$$('fmDeleteLabel').innerHTML = fmMsg[lang].fmDeleteLabel;
								$$('fmDeleteButton').value = fmMsg[lang].fmDeleteButton;
								$$('fmRenameLabel').innerHTML = fmMsg[lang].fmRenameLabel;
								$$('fmRenameButton').value = fmMsg[lang].fmRenameButton;
								$$('fmSaveFromUrlLabel').innerHTML = fmMsg[lang].fmSaveFromUrlLabel;
								$$('fmSaveFromUrlButton').value = fmMsg[lang].fmSaveFromUrlButton;

								if(doResize) {
									fmTools.addListener(window, 'resize', function() {
										fmLib.isResized[curCont] = false;
										clearTimeout(fmLib.resizeTimeout);
										fmLib.resizeTimeout = setTimeout('fmLib.setFileManagerSize("' + curCont + '", true)', 250);
									});
									if(fmContSettings[curCont].adminTheme == 'AdminThemeReno') {
										obj = document.getElementsByClassName('main-nav-toggle')[0];
										fmTools.addListener(obj, 'click', function() {
											fmLib.isResized[curCont] = false;
											clearTimeout(fmLib.resizeTimeout);
											fmLib.resizeTimeout = setTimeout('fmLib.setFileManagerSize("' + curCont + '", true)', 250);
										});
									}
								}
								if(mode) fmLib.call(url + '&fmMode=' + mode);
							});
						}
						else if(mode) fmLib.call(url + '&fmMode=' + mode);
					});
				}
				else if(mode) fmLib.call(url + '&fmMode=' + mode);
			});
		}
		else {
			this.setFileManagerSize(curCont);
			if(mode) this.call(url + '&fmMode=' + mode);
		}

		return true;
	},

	setFileManagerSize: function(curCont, doParse) {
		var fmCont = $$(curCont);
		var listCont = $$(curCont + 'List');
		var expCont = $$(curCont + 'Exp');
		var infoCont = $$(curCont + 'Info');
		var doResize = false;
		var width, height;
		var style, parentWidth, main, fmWrapper, footer, pw_container, pw_content, footer_mb;
		var body, windowHeight;

		// do not resize if software keyboard of mobile devices is active
		if(this.inputFocus) return false;

		//if(typeof fmContSettings[curCont].fmWidth == 'string' && fmContSettings[curCont].fmWidth.indexOf('%') != -1) {
		if(typeof fmContSettings[curCont].fmWidth == 'string' && fmContSettings[curCont].fmWidth.indexOf('%') == -1) {
			parentWidth = fmCont.parentNode.style.width ? fmCont.parentNode.offsetWidth : fmTools.getWindowWidth();
			width = Math.round(parentWidth * parseInt(fmContSettings[curCont].fmWidth) / 100);
			//style = parseInt(getComputedStyle(fmCont.parentNode.parentNode).getPropertyValue('padding-right'));
			//width = width - style;
			fmCont.style.width = width + 'px';
			doResize = true;
		}

		if(typeof fmContSettings[curCont].fmHeight == 'string' && fmContSettings[curCont].fmHeight.indexOf('%') != -1) {
		//if(typeof fmContSettings[curCont].fmHeight == 'string' && fmContSettings[curCont].fmHeight.indexOf('%') == -1) {
			//MP this must always execute

			body = document.body;
			windowHeight = fmTools.getWindowHeight();// - parseInt(getComputedStyle(footer).getPropertyValue('margin-bottom'))
			if(fmContSettings[curCont].adminTheme == 'AdminThemeReno') {
				body = $$('main');
				windowHeight = windowHeight - 52;
			}
			var fmContTable = document.getElementsByClassName('fmContTable')[0];
			fmContTable.style.display = "none"; // to get the correct height of fmCont
			for(height = 150; height < 2500; height++) {
				fmCont.style.height = height + 'px';
				if(body.scrollHeight - body.scrollTop === windowHeight) break;
			}
			fmContTable.style.display = "block";
			height = height - 2;
			doResize = true;
		} else {
			height = fmCont.offsetHeight - 2;
		}

		fmCont.style.height = (height + 2) + 'px';

		title = $$(curCont + 'Title');
		if(title) {
			height -= fmTools.outerHeight(title); //reduce the total height for the height of title
		}

		if(fmContSettings[curCont].logHeight > 0) {
			height -= fmContSettings[curCont].logHeight + 1;
		}
		listCont.style.height = height + 'px';

		if(expCont) {
			expCont.style.height = height + 'px';

			if(typeof fmContSettings[curCont].explorerWidth == 'string' && fmContSettings[curCont].explorerWidth.indexOf('%') != -1) {
				expCont.style.width = Math.round(fmCont.offsetWidth * parseInt(fmContSettings[curCont].explorerWidth) / 100) + 'px';
			}
			else expCont.style.width = fmContSettings[curCont].explorerWidth + 'px';

			listCont.style.width = (fmCont.offsetWidth - expCont.offsetWidth - 2) + 'px'; //MP disabled
		}
		//else listCont.style.width = (fmCont.offsetWidth - 2) + 'px';//MP disabled

		if(infoCont) {
			infoCont.style.width = fmCont.offsetWidth + 'px';
		}

		if(doParse) {
			this.viewResponse(fmContSettings[curCont].listJson, curCont, null, true);
		}

		return doResize;
	},

	setContMenu: function(toggle) {
		setTimeout('fmLib.browserContextMenu=' + toggle, 100);
	},

	getExplorer: function(curCont, caption, link, folderId) {
		if(fmContSettings[curCont].expJson) {
			var html = fmParser.parseExplorer(fmContSettings[curCont].expJson, link);

			if(caption) {
				this.openDialog(null, 'fmExplorer', [caption, html]);
			}
			else {
				var obj = $$(curCont + 'Exp');
				if(obj) obj.innerHTML = html;
			}
		}
		else {
			var i = $$(curCont + 'DirIcon' + folderId);
			if(i) i.className = "fmIconSpinner";

			var url = '?action&fmContainer=' + curCont + '&fmMode=getExplorer';
			var ajaxObj = new ajax();

			ajaxObj.makeRequest(url, function() {
				if(!ajaxObj.response) {
					alert('ERROR: Could not load explorer!');
					return false;
				}
				var json = eval('(' + ajaxObj.response + ')');
				var html = fmParser.parseExplorer(json, link);

				if(caption) {
					fmLib.openDialog(null, 'fmExplorer', [caption, html]);
				}
				else {
					var obj = $$(curCont + 'Exp');
					if(obj) obj.innerHTML = html;
					setTimeout(function(){document.getElementsByClassName('fmContTable')[0].style.visibility = "visible";}, 10);
				}
			});
		}
	},

	toggleTreeItem: function(i) {
		var div, arr;

		if(i) {
			if(div = i.parentNode.nextSibling) {
				arr = div.id.split('|');

				if(div.style.display == 'none') {
					div.style.display = 'block';
					fmContSettings[arr[0]].expanded[arr[1]] = true;
					i.classList.remove('fmIconTreeOpen');
					i.classList.add('fmIconTreeClose');
					if(i.nextSibling) {i.nextSibling.classList.remove('dirClose');i.nextSibling.classList.add('dirOpen');}
				}
				else {
					div.style.display = 'none';
					fmContSettings[arr[0]].expanded[arr[1]] = false;
					i.classList.remove('fmIconTreeClose');
					i.classList.add('fmIconTreeOpen');
					if(i.nextSibling) {i.nextSibling.classList.remove('dirOpen');i.nextSibling.classList.add('dirClose');}
				}
			}
		}
	},

	toggleListView: function(curCont) {
		var json = fmContSettings[curCont].listJson;
		if(!json) return false;

		var type = (fmContSettings[curCont].listType == 'details') ? 'icons' : 'details';
		fmContSettings[curCont].listType = type;

		fmParser.parseMain(json, $$(curCont + 'List'));
		fmParser.parseTitle(json, $$(curCont + 'Title'));
		if(this.dialog && this.opacity) this.fadeOut(this.opacity, this.dialog);
	},

	sortList: function(curCont, field, order) {
		var json = fmContSettings[curCont].listJson;
		if(!json) return false;

		this.sortJson(json, field, order);
		fmContSettings[curCont].sort.field = field;
		fmContSettings[curCont].sort.order = order;

		fmParser.parseMain(json, $$(curCont + 'List'));
	},

	sortJson: function(json, field, order) {
		if(!json.entries || !json.cont) return false;
		var items = json.entries.items;
		var i, j, cnt, swap, prefix, str1, str2, temp;

		if(!field) field = fmContSettings[json.cont].sort.field;
		if(!order) order = fmContSettings[json.cont].sort.order;

		cnt = items.length;
		swap = true;

		while(cnt && swap) {
			swap = false;

			for(i = 0; i < cnt; i++) {
				if(items[i].name != '..' && items[i].name != '') {
					for(j = i; j < cnt - 1; j++) {
						if(field == 'isDir') {
							prefix = items[j].isDir ? 'a' : 'z';
							str1 = prefix + items[j].name.toLowerCase();
							prefix = items[j + 1].isDir ? 'a' : 'z';
							str2 = prefix + items[j + 1].name.toLowerCase();
						}
						else if(field == 'size') {
							str1 = fmTools.toBytes(items[j].size);
							str2 = fmTools.toBytes(items[j + 1].size);
						}
						else if(field == 'changed') {
							str1 = items[j]['changedTimeStamp'];
							str2 = items[j + 1]['changedTimeStamp'];
						}
						else {
							str1 = items[j][field].toLowerCase();
							str2 = items[j + 1][field].toLowerCase();
						}

						if((order == 'asc' && str1 > str2) || (order == 'desc' && str1 < str2)) {
							temp = items[j];
							items[j] = items[j + 1];
							items[j + 1] = temp;
							swap = true;
						}
					}
				}
			}
			cnt--;
		}
	},

	setOpacity: function(opacity, obj) {
		fmTools.setOpacity(opacity, obj);
		this.opacity = opacity;
	},

	fadeIn: function(opacity, obj) {
		if(obj) {
			if(this.fadeSpeed && opacity < 100) {
				opacity += this.fadeSpeed;
				if(opacity > 100) opacity = 100;
				this.setOpacity(opacity, obj);
				obj.style.visibility = 'visible';
				obj.style.display = 'block';
				setTimeout(this.fadeIn.bind(this, opacity, obj), 1);
			}
			else {
				this.setOpacity(100, obj);
				obj.style.visibility = 'visible';
				obj.style.display = 'block';
				this.dialog = obj;
			}
		}
	},

	fadeOut: function(opacity, obj, force) {
		if(obj && (obj.id != 'fmEditor' || force)) {
			if(this.fadeSpeed && opacity > 0) {
				opacity -= this.fadeSpeed;
				if(opacity < 0) opacity = 0;
				this.setOpacity(opacity, obj);
				setTimeout(this.fadeOut.bind(this, opacity, obj, force), 1);
			}
			else {
				this.setOpacity(0, obj);
				obj.style.visibility = 'hidden';
				obj.style.display = 'none';
				this.dialog = null;
				if(obj.id == 'fmMediaPlayer') this.stopPlayback();
			}
			//if(obj.id == 'fmEditor' || obj.id == 'fmDocViewer') {
			if(obj.id == 'fmDocViewer') {
				fmOverlay = $$('fmOverlay');
				if(fmOverlay) fmOverlay.style.display = 'none';
			}
		}
	},

	setDialogLeft: function(x, obj, curCont) {
		if(!obj) obj = this.dialog;
		var offset = 0;
		if(curCont) offset = fmTools.getOffset(curCont).left;
		var width = obj.offsetWidth;
		var left = x ? x : this.mouseX - width - offset + 22;

		if(left < 0) left = 0;
		if(x) left += fmTools.getScrollLeft();
		obj.style.left = left + 'px';
	},

	setDialogTop: function(y, obj, curCont) {
		if(!obj) obj = this.dialog;
		var offset = 0;
		if(curCont) offset = fmTools.getOffset(curCont).top;
		var hght = obj.offsetHeight;
		var top = y ? y : this.mouseY - offset - 12;

		var winY = fmTools.getWindowHeight();
		var scrTop = fmTools.getScrollTop();

		if(y) top += scrTop;
		else if(top + hght + offset - scrTop > winY) {
			if(hght > winY) top = 0;
			else top = winY + scrTop - hght - offset - 3;
		}
		obj.style.top = top + 'px';
	},

	openDialog: function(url, dialogId, text, fileId, x, y) {
		var f, e, i, obj, sid, tmp, curCont, iframeCont, dialog, perc, dir, width, height, name, perms, viewIcon, src;
		var pwsettings, setPos, maxWidth, maxHeight, fmDocViewerText;

		// this is shortened and modified pwModalWindowSettings function from modal.js
		function fmPWModalWindowSettings(name) {
			var modal = ProcessWire.config.modals[name];
			if(typeof modal == "undefined") modal = ProcessWire.config.modals['medium'];
			modal = modal.split(',');

			// options that can be customized via config.modals, with default values
			var options = {
				modal: true,
				draggable: false,
				resizable: true,
				hide: 250,
				show: 100,
				hideOverflow: true,
				closeOnEscape: true
			}

			if(modal.length >= 4) {
				for(var n = 4; n < modal.length; n++) {
					var val = modal[n];
					if (val.indexOf('=') < 1) continue;
					val = val.split('=');
					var key = val[0].trim();
					val = val[1].toLowerCase().trim();
					if (typeof options[key] == "undefined") continue;
					if (val == "true" || val == "1") {
						val = true;
					} else if (val == "false" || val == "0") {
						val = false;
					} else {
						val = parseInt(val);
					}
					options[key] = val;
				}
			}

			return {
				position: [ parseInt(modal[0]), parseInt(modal[1]) ],
				width: fmTools.getWindowWidth() - parseInt(modal[2]),
				height: fmTools.getWindowHeight() - parseInt(modal[3]),
				closeOnEscape: options.closeOnEscape
			}
		};

		// set the dialog to the full width/height based on PW modal settings
		function setDialogDimensions(dialog) {
			// add overlay
			$$('fmOverlay').style.display = 'block';

			dialog.style.display = 'block'; // to get the heights
			dialog.style.position = 'fixed';

			if(!pwsettings) pwsettings = fmPWModalWindowSettings('large');

			// set the heights and positions of the dialog window
			dialog.style.width = pwsettings.width + 'px';
			dialog.style.height = pwsettings.height + 'px';
			dialog.style.top = pwsettings.position[0] + 'px';
			dialog.style.left = pwsettings.position[1] + 'px';
		}

		if(url) {
			url.match(/fmContainer=(\w+)/);
			curCont = RegExp.$1;
		}

		if(this.noMenu) {
			this.noMenu = false;
			return;
		}

		setPos = true;

		switch(dialogId) {

			case 'fmMediaPlayer':
				obj = $$('fmMediaCont');
				if(obj) {
					obj.style.width = fmContSettings[curCont].mediaPlayerWidth + 'px';
					obj.style.height = fmContSettings[curCont].mediaPlayerHeight + 'px';
				}
				viewIcon = this.setMediaPlayerIcon(url, curCont);
				obj = $$('fmMediaPlayerText');
				if(obj) obj.style.width = (fmContSettings[curCont].mediaPlayerWidth - (viewIcon ? 51 : 32)) + 'px';
				if(this.mpIv) clearInterval(this.mpIv);
				break;

			case 'fmDocViewer':
			case 'fmPdfViewer':
				if(typeof fileId != 'object') {
					obj = $$('fmDocViewerCont');
					if(obj) {
						dialog = $$('fmDocViewer');
						setDialogDimensions(dialog);

						// set max possible dimensions for the container
						fmDocViewerText = $$('fmDocViewerText'); // title
						maxWidth = dialog.clientWidth;
						maxHeight = dialog.clientHeight - fmDocViewerText.clientHeight;

						//obj.style.width = maxWidth + 'px'; // not needed
						obj.style.height =  maxHeight + 'px';
						obj.style.textAlign = 'center';

						if(dialogId == 'fmPdfViewer') {
							src = url + '&fmMode=loadFile&fmObject=' + fileId;
							dialogId = 'fmDocViewer';
						}
						else {
							if(fmEntries[curCont][fileId].dir) dir = fmEntries[curCont][fileId].dir;
							else dir = fmContSettings[curCont].listJson.path;
							url = fmContSettings[curCont].publicUrl;
							//remove trailing slash, if present
							if(url.charAt(url.length - 1) == "/") url = url.substring(0, url.length - 1);
							url = url + fmEntries[curCont][fileId].fullName;
							src = fmContSettings[curCont].docViewerUrl + encodeURI(url);
						}
						//width = fmContSettings[curCont].docViewerWidth;
						//height = fmContSettings[curCont].docViewerHeight;
						height = maxHeight;
						obj.innerHTML = '<iframe src="' + src + '" border="0" frameborder="0" style="width:100%; height:' + height + 'px"></iframe>';

						// prevent the table to become to wide
						//fmDocViewerText.style.width = (maxWidth - 60) + 'px';
					}
					setPos = false;
				}
				break;

			case 'fmTextViewer':
				if(typeof fileId != 'object') {
					obj = $$('fmDocViewerCont');
					dialogId = 'fmDocViewer';
					if(obj) {
						// the height of the editor window (textarea) is set in initTextViewer function
						dialog = $$(dialogId);
						setDialogDimensions(dialog);

						// set max possible dimensions for the container
						fmDocViewerText = $$('fmDocViewerText'); // title xxx
						maxWidth = dialog.clientWidth;
						maxHeight = dialog.clientHeight - fmDocViewerText.clientHeight;

						obj.style.width = maxWidth + 'px';
						obj.style.height = maxHeight + 'px';
						obj.style.textAlign = 'left';

						// prevent the table to become to wide
						fmDocViewerText.style.width = (maxWidth - 60) + 'px';

						obj.innerHTML = '<div id="fmTextViewerCont"></div>';
					}
					setPos = false;
					this.call(url + '&fmMode=readTextFile&fmObject=' + fileId, dialogId);
				}
				break;

			case 'fmEditor':
				if(typeof fileId != 'object') {
					obj = $$('fmEditorCont');
					if(obj) {
						// the height of the editor window (textarea) is set in initEditor function
						dialog = $$(dialogId);
						setDialogDimensions(dialog);

						// set max possible dimensions for the container
						fmEditorText = $$('fmEditorText'); // title
						fmEditorSaveButton = $$('fmEditorSaveButton'); // save button at the bottom

						// should offsetHeight be used instead of clientHeight?
						maxWidth = dialog.clientWidth;
						maxHeight = dialog.clientHeight - fmEditorText.clientHeight - fmEditorSaveButton.clientHeight;

						obj.style.width = maxWidth + 'px';
						obj.style.height = maxHeight + 'px';
						obj.style.textAlign = 'left';

						// prevent the table to become to wide
						fmEditorText.style.width = (maxWidth - 60) + 'px';

						obj.innerHTML = '';
					}
					setPos = false;
					this.call(url + '&fmMode=edit&fmObject=' + fileId, dialogId);
				}
				break;

			case 'fmImgViewer':
			case 'fmCoverViewer':
				if(typeof fileId != 'object') {
					obj = $$('fmDocViewerCont');
					if(obj) {
						dialog = $$('fmDocViewer');
						setDialogDimensions(dialog);

						// set max possible dimensions for the container
						fmDocViewerText = $$('fmDocViewerText'); // title
						maxWidth = dialog.clientWidth;
						maxHeight = dialog.clientHeight - fmDocViewerText.clientHeight;

						//obj.style.width = maxWidth + 'px'; // not needed
						obj.style.height =  maxHeight + 'px';

						obj.style.textAlign = 'center'; // for editor it should be left

						width = parseInt(fmEntries[curCont][fileId].width); // image width
						height = parseInt(fmEntries[curCont][fileId].height); // image height

						// "resize the image" to specified max dimensions specified in the settings
						if(width > fmContSettings[curCont].thumbMaxWidth) {
							perc = fmContSettings[curCont].thumbMaxWidth / width;
							width = fmContSettings[curCont].thumbMaxWidth;
							height = Math.round(height * perc);
						}
						if(height > fmContSettings[curCont].thumbMaxHeight) {
							perc = fmContSettings[curCont].thumbMaxHeight / height;
							height = fmContSettings[curCont].thumbMaxHeight;
							width = Math.round(width * perc);
						}

						// set minimum and maximum size
						//width = width < 100 ? 100 : width;
						//height = height < 50 ? 50 : height;
						width = width > maxWidth ? maxWidth : width;
						height = height > maxHeight ? maxHeight : height;

						// set the position of the container
						posTop = parseInt((maxHeight - height) / 2);
						posLeft = parseInt((maxWidth - width) / 2);

						if(dialogId == 'fmCoverViewer') {
							name = fmEntries[curCont][fileId].id3.Picture;
							url = '?action&fmContainer=' + curCont + '&fmMode=getCachedImage&fmObject=' + name + '&width=' + width + '&height=' + height;
						}
						else url = '?action&fmContainer=' + curCont + '&fmMode=getThumbnail&fmObject=' + fileId + '&hash=' + fmEntries[curCont][fileId].hash;

						obj.innerHTML = '<div class="fmThumbnail" background-color:#FFF;cursor:pointer" onClick="fmLib.fadeOut(50, fmLib.dialog)">' +
														'<div id="fmThumbnail1" style="position:relative;width:' + width + 'px;height:' + height + 'px;' +
														'top:' + posTop + 'px;left:' + posLeft + 'px;' +
														'background:url(' + url + ') center no-repeat;background-size:contain"></div></div>\n';
					}
					dialogId = 'fmDocViewer';
					setPos = false;
				}
				break;

			default:
				if(f = document.forms[dialogId]) {
					f.reset();

					if(typeof fileId == 'number' || (typeof fileId == 'string' && fileId.indexOf(',') == -1)) {
						name = fmEntries[curCont][fileId].name;
						perms = fmEntries[curCont][fileId].permissions;
					}
					else name = perms = '';

					if(typeof fileId == 'object') fileId = fileId.join(',');
					if(fileId && f.fmObject) f.fmObject.value = fileId;
					if(name && f.fmName) f.fmName.value = name;

					switch(dialogId) {

						case 'fmNewFile':
							for(i = 1; i < 10; i++) {
								if(f['fmFile[' + i + ']']) {
									f['fmFile[' + i + ']'].style.display = 'none';
								}
							}

							if(fmContSettings[curCont] && fmContSettings[curCont].perlEnabled) {
								sid = fmContSettings[curCont].sid;
								tmp = fmContSettings[curCont].tmp;
								f.action = fmWebPath + '/cgi/upload.pl?cont=' + curCont + '&sid=' + sid + '&tmp=' + tmp;
							} else {
								f.action = url;
								sid = '';
							}

							f.target = 'fmFileAction';
							f.onsubmit = function() {
								if(fmLib.dialog && fmLib.opacity) fmLib.fadeOut(fmLib.opacity, fmLib.dialog);
								var fmCont = $$(curCont);
								var listLoad = fmLib.viewLoader(fmCont, url);
								fmLib.fileIv = setInterval(fmLib.checkFile.bind(fmLib, listLoad, sid, curCont), 250);
								fmContSettings[curCont].expJson = null;
							}
							break;

						case 'fmJavaUpload':
							if(frames.JUpload.document.location.href.match(/(fmCont\d+)/)) {
								iframeCont = RegExp.$1;
							}
							else iframeCont = '';

							if(iframeCont != curCont) {
								frames.JUpload.document.location.href = '?action&fmContainer=' + curCont + '&fmMode=jupload';
							}
							f.action = "javascript:fmLib.call('" + url + "', '" + dialogId + "')";
							break;

						case 'fmFileDrop':
							if(!this.fdObj[curCont]) {
								fd.logging = false;
								this.fdObj[curCont] = {};
								//MP todo: this won't work
								this.fdObj[curCont].obj = new FileDrop('fdZone', {iframe: {url: fmWebPath + '/ext/filedrop/upload.php?fmContainer=' + curCont}});
								this.fdObj[curCont].obj.multiple(true);
								this.fdObj[curCont].obj.event('iframeSetup', function() {
									var pbar = $$('fmFileDropProgress');
									pbar.innerHTML = '<i class="fmIconSpinner">';
									pbar.style.display = 'block';
								});
								this.fdObj[curCont].obj.event('iframeDone', function(response) {
									fmLib.call('?action&fmContainer=' + curCont, 'fmFileDrop');
									fmLib.fdObj[curCont].uploading = false;
									var pbar = $$('fmFileDropProgress');
									pbar.innerHTML = '';
									pbar.style.display = 'none';
								});
								this.fdObj[curCont].obj.event('send', function(files) {
									if(!fmLib.fdObj[curCont].uploading) {
										fmLib.fdObj[curCont].uploading = true;
										var fdFileCnt = 0;
										var timeStart = Math.round(new Date().getTime() / 1000);
										var pbar = $$('fmFileDropProgress');
										var json;

										files.each(function(file) {
											file.event('error', function(e, xhr) {
												try {
													if(xhr.readyState == 4 && !xhr.status) {
														alert('Timeout reached, request aborted.')
													}
													else alert(xhr.status + ': ' + xhr.statusText);
												}
												catch(e) {}
											});
											file.event('done', function(xhr) { fdFileCnt++; });
											file.event('progress', function(current, total) {
												json = {
													filename: file.name,
													bytesTotal: total,
													bytesCurrent: current,
													timeStart: timeStart,
													timeCurrent: Math.round(new Date().getTime() / 1000)
												};
												pbar.innerHTML = fmLib.drawProgBar(json);
												pbar.style.display = 'block';
											});
											file.sendTo(fmWebPath + '/ext/filedrop/upload.php?fmContainer=' + curCont);
										});

										function fdWait() {
											if(fdFileCnt >= files.length) {
												fmLib.call('?action&fmContainer=' + curCont, 'fmFileDrop');
												fmLib.fdObj[curCont].uploading = false;
												pbar.innerHTML = '';
												pbar.style.display = 'none';
											}
											else setTimeout(fdWait, 250);
										}
										fdWait();
									}
								});
								var lang = fmContSettings[curCont].language;
								$$('fmFileDropBoxTitle').innerHTML = fmMsg[lang].cmdDropFile;
								$$('fmFileDropBoxContent').innerHTML = fmMsg[lang].cmdBrowse;
							}
							break;

						case 'fmPerm':
							if(perms) {
								e = f.elements;
								for(i = 0; i < 9; i += 3) {
									e['fmPerms[' + i + ']'].checked = (perms[i + 1] == 'r');
									e['fmPerms[' + (i + 1) + ']'].checked = (perms[i + 2] == 'w');
									e['fmPerms[' + (i + 2) + ']'].checked = (perms[i + 3] == 'x');
								}
							}
							f.action = "javascript:fmLib.call('" + url + "', '" + dialogId + "')";
							break;

						default:
							f.action = "javascript:fmLib.call('" + url + "', '" + dialogId + "')";
					}
				}
		}

		if(text) {
			if(typeof(text) != 'object') text = [text];
			for(i = 0; i < text.length; i++) {
				obj = $$(dialogId + 'Text' + (i ? i + 1 : ''));
				if(obj) obj.innerHTML = text[i];//MP ??
			}
		}

		dialog = $$(dialogId);

		// remove ui-state-active class left when dialog was opened before
		var inputs = dialog.querySelectorAll("input[type=submit]");
		for (var i = 0; i < inputs.length; i++) {
    	inputs[i].classList.remove('ui-state-active');
		}

		if(this.dialog && this.opacity && this.dialog != dialog) {
			this.fadeOut(this.opacity, this.dialog);
		}

		if(this.curCont1 == null) {
			this.curCont1 = curCont;
		}

		// show the dialog
		this.fadeIn(0, dialog);

		if(setPos) {
			this.setDialogLeft(x, dialog, $$(this.curCont1));
			this.setDialogTop(y, dialog, $$(this.curCont1));
		}

		/* this must be executed when dialog is visible */
		if(dialogId == 'fmMediaPlayer') {
			fmParser.parseMediaPlayer({curCont:curCont,id:fileId,url:url});
		}
		else if(f && f.fmName) f.fmName.focus();
		return dialog;
	},

	viewError: function(msg, curCont) {
		var lang = fmContSettings[curCont].language;
		var caption = lang ? [fmMsg[lang].error, msg] : ['&nbsp;', msg];
		var x = Math.round((fmTools.getWindowWidth() - 400) / 2);
		var y = Math.round((fmTools.getWindowHeight() - 50) / 2);
		this.openDialog(null, 'fmError', caption, null, x, y);
	},

	viewProgress: function(msg) {
		var x = Math.round((fmTools.getWindowWidth() - 240) / 2);
		var y = Math.round((fmTools.getWindowHeight() - 200) / 2);
		this.progBar = this.openDialog(null, 'fmProgress', msg, null, x, y);
	},

	fileInfo: function(id, curCont) {
		var lang = fmContSettings[curCont].language;
		var html = fmParser.parseFileInfo(curCont, id, lang);
		this.openDialog(null, 'fmInfo', [fmMsg[lang].fileInfo, html]);
	},

	viewMenu: function(id, curCont) {
		if(this.noMenu) {
			this.noMenu = false;
			return;
		}
		var caption, html, confirm, cmd, icn, dialogId, ids;
		var lang = fmContSettings[curCont].language;
		var url = '?action&fmContainer=' + curCont;
		var userPerms = fmContSettings[curCont].userPerms;

		var items = [];

		switch(id) {

			case 'bulkAction':
				ids = fmTools.getSelectedItems(curCont);

				if(userPerms.bulkDownload) {
					if(ids.length > 0) items.push({icon:'fmIconDownload',caption:fmMsg[lang].cmdDownload,exec:['fmLib.getCheckedFiles',curCont,ids]});
					else items.push({icon:'fmIconDownload fmIcon_dimmed',caption:fmMsg[lang].cmdDownload});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconDownload fmIcon_dimmed',caption:fmMsg[lang].cmdDownload});
				}

				if(userPerms.move) {
					if(ids.length > 0) items.push({icon:'fmIconMove',caption:fmMsg[lang].cmdMove,exec:['fmLib.moveCheckedFiles',curCont,fmMsg[lang].cmdMove,ids]});
					else items.push({icon:'fmIconMove fmIcon_dimmed',caption:fmMsg[lang].cmdMove});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconMove fmIcon_dimmed',caption:fmMsg[lang].cmdMove});
				}

				if(userPerms.remove) {
					confirm = userPerms.restore ? '' : fmMsg[lang].msgDelItems;
					if(ids.length > 0) items.push({icon:'fmIconDelete',caption:fmMsg[lang].cmdDelete,exec:['fmLib.deleteCheckedFiles',curCont, fmMsg[lang].cmdDelete,confirm,ids]});
					else items.push({icon:'fmIconDelete fmIcon_dimmed',caption:fmMsg[lang].cmdDelete});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconDelete fmIcon_dimmed',caption:fmMsg[lang].cmdDelete});
				}
				break;

			default:
				if(id >= 0) {
					items.push({caption:'separator',title:fmMsg[lang].fileActions + ': ' + fmEntries[curCont][id].name});

					if(fmEntries[curCont][id].deleted) {
						items.push({icon:'fmIconRecycle',caption:fmMsg[lang].cmdRestore,call:'restore'});

						if(userPerms.remove) {
							items.push({icon:'fmIconDelete',caption:fmMsg[lang].cmdDelete,dialog:'fmDelete',confirm:fmMsg[lang].msgDeleteFile});
						}
					}
					else {
						if(fmEntries[curCont][id].isDir) {
							items.push({icon:'fmIconDirChange',caption:fmMsg[lang].cmdChangeDir,call:'open'});
						}
						else {
							if(typeof fmContSettings[curCont].customAction == 'object' && fmContSettings[curCont].customAction.action) {
								items.push({icon:'fmIconCursor',caption:fmContSettings[curCont].customAction.caption,exec:[fmContSettings[curCont].customAction.action,curCont,id,fmEntries[curCont][id].fullName]});
							}

							if(fmEntries[curCont][id].name.match(fmParser.imageFiles)) {
								if(userPerms.imgViewer) {
									items.push({icon:'fmIconView',caption:fmMsg[lang].cmdView,dialog:'fmImgViewer'});
								}
								else if(!userPerms.hideDisabledIcons) {
									items.push({icon:'fmIconView fmIcon_dimmed',caption:fmMsg[lang].cmdView});
								}

								if(userPerms.rotate) {
									items.push({icon:'fmIconRotateLeft',caption:fmMsg[lang].cmdRotateLeft,call:'rotateLeft'});
									items.push({icon:'fmIconRotateRight',caption:fmMsg[lang].cmdRotateRight,call:'rotateRight'});
								}
								else if(!userPerms.hideDisabledIcons) {
									items.push({icon:'fmIconRotateLeft fmIcon_dimmed',caption:fmMsg[lang].cmdRotateLeft});
									items.push({icon:'fmIconRotateRight fmIcon_dimmed',caption:fmMsg[lang].cmdRotateRight});
								}
							}
							else if(fmEntries[curCont][id].name.match(fmParser.audioFiles) || fmEntries[curCont][id].name.match(fmParser.videoFiles)) {
								if(userPerms.mediaPlayer) {
									items.push({icon:'fmIconPlay',caption:fmMsg[lang].cmdPlay,dialog:'fmMediaPlayer'});
								}
								else if(!userPerms.hideDisabledIcons) {
									items.push({icon:'fmIconPlay fmIcon_dimmed',caption:fmMsg[lang].cmdPlay});
								}
							}
							else if(fmEntries[curCont][id].docType > 0) {
								switch(fmEntries[curCont][id].docType) {

									case 1:	// plain text
										if(userPerms.docViewer) {
											items.push({icon:'fmIconView',caption:fmMsg[lang].cmdView,dialog:'fmTextViewer'});
										}
										else if(!userPerms.hideDisabledIcons) {
											items.push({icon:'fmIconView fmIcon_dimmed',caption:fmMsg[lang].cmdView});
										}

										if(userPerms.edit) {
											items.push({icon:'fmIconEdit',caption:fmMsg[lang].cmdEdit,dialog:'fmEditor'});
										}
										else if(!userPerms.hideDisabledIcons) {
											items.push({icon:'fmIconEdit fmIcon_dimmed',caption:fmMsg[lang].cmdEdit});
										}
										break;

									case 2: // Google Docs Viewer
										if(userPerms.docViewer && fmEntries[curCont][id].name.match(/\.pdf$/i)) {
											items.push({icon:'fmIconView',caption:fmMsg[lang].cmdView,dialog:'fmPdfViewer'});
										}
										else if(userPerms.docViewer && fmContSettings[curCont].publicUrl != '') {
											items.push({icon:'fmIconView',caption:fmMsg[lang].cmdView,dialog:'fmDocViewer'});
										}
										else if(!userPerms.hideDisabledIcons) {
											items.push({icon:'fmIconView fmIcon_dimmed',caption:fmMsg[lang].cmdView});
										}
										break;
								}
							}
						}

						if(fmEntries[curCont][id].isDir) {
							if(userPerms.bulkDownload) {
								items.push({icon:'fmIconDownload',caption:fmMsg[lang].cmdDownload,exec:['fmLib.getCheckedFiles',curCont,id]});
							}
							else if(!userPerms.hideDisabledIcons) {
								items.push({icon:'fmIconDownload fmIcon_dimmed',caption:fmMsg[lang].cmdDownload});
							}
						}
						else if(userPerms.download) {
							items.push({icon:'fmIconDownload',caption:fmMsg[lang].cmdDownload,exec:['fmLib.getFile',curCont,id]});
						}
						else if(!userPerms.hideDisabledIcons) {
							items.push({icon:'fmIconDownload fmIcon_dimmed',caption:fmMsg[lang].cmdDownload});
						}
						items.push({icon:'fmIconInfo',caption:fmMsg[lang].cmdFileInfo,exec:['fmLib.fileInfo',id,curCont]});
						items.push({caption:'separator'});

						if(userPerms.rename) {
							items.push({icon:'fmIconRename',caption:fmMsg[lang].cmdRename,dialog:'fmRename'});
						}
						else if(!userPerms.hideDisabledIcons) {
							items.push({icon:'fmIconRename fmIcon_dimmed',caption:fmMsg[lang].cmdRename});
						}

						if(fmContSettings[curCont].isWin == 0) {
							if(userPerms.permissions) {
								items.push({icon:'fmIconPermissions',caption:fmMsg[lang].cmdChangePerm,dialog:'fmPerm',text:[fmMsg[lang].owner,fmMsg[lang].group,fmMsg[lang].other,fmMsg[lang].read,fmMsg[lang].write,fmMsg[lang].execute]});
							}
							else if(!userPerms.hideDisabledIcons) {
								items.push({icon:'fmIconPermissions fmIcon_dimmed',caption:fmMsg[lang].cmdChangePerm});
							}
						}

						if(userPerms.move) {
							caption = fmMsg[lang].cmdMove + ': ' + fmEntries[curCont][id].name;
							caption = caption.replace(/\'/g, "\'");
							items.push({icon:'fmIconMove',caption:fmMsg[lang].cmdMove,exec:['fmLib.getExplorer',curCont,caption,url + '&fmMode=move&fmObject=' + id]});
						}
						else if(!userPerms.hideDisabledIcons) {
							items.push({icon:'fmIconMove fmIcon_dimmed',caption:fmMsg[lang].cmdMove});
						}

						if(!fmEntries[curCont][id].isDir) {
							if(userPerms.copy) {
								caption = fmMsg[lang].cmdCopy + ': ' + fmEntries[curCont][id].name;
								caption = caption.replace(/\'/g, "\'");
								items.push({icon:'fmIconCopy',caption:fmMsg[lang].cmdCopy,exec:['fmLib.getExplorer',curCont,caption,url + '&fmMode=copy&fmObject=' + id]});
							}
							else if(!userPerms.hideDisabledIcons) {
								items.push({icon:'fmIconCopy fmIcon_dimmed',caption:fmMsg[lang].cmdCopy});
							}
						}

						if(userPerms.remove) {
							if(userPerms.restore) {
								items.push({icon:'fmIconDelete',caption:fmMsg[lang].cmdDelete,call:'delete'});
							}
							else {
								cmd = fmEntries[curCont][id].isDir ? fmMsg[lang].msgRemoveDir : fmMsg[lang].msgDeleteFile;
								items.push({icon:'fmIconDelete',caption:fmMsg[lang].cmdDelete,dialog:'fmDelete',confirm:cmd});
							}
						}
						else if(!userPerms.hideDisabledIcons) {
							items.push({icon:'fmIconDelete fmIcon_dimmed',caption:fmMsg[lang].cmdDelete});
						}
					}
					items.push({caption:'separator',title:fmMsg[lang].globalActions});
				}
				items.push({icon:'fmIconRefresh',caption:fmMsg[lang].cmdRefresh,call:'refreshAll'});

				if(fmContSettings[curCont].listType == 'details') {
					cmd = fmMsg[lang].cmdIcons;
					icn = 'fmIconViewIcons'
				}
				else {
					cmd = fmMsg[lang].cmdDetails;
					icn = 'fmIconViewDetails'
				}
				items.push({icon:icn,caption:cmd,exec:['fmLib.toggleListView',curCont]});

				if(userPerms.restore) {
					if(fmContSettings[curCont].viewDeleted) {
						icn = 'fmIconTrashbinClosed';
						caption = fmMsg[lang].cmdHideDeleted;
					}
					else {
						icn = 'fmIconTrashbin';
						caption = fmMsg[lang].cmdViewDeleted;
					}
					items.push({icon:icn,caption:caption,call:'toggleDeleted'});
				}

				if(userPerms['search']) {
					items.push({icon:'fmIconSearch',caption:fmMsg[lang].cmdSearch,dialog:'fmSearch'});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconSearch fmIcon_dimmed',caption:fmMsg[lang].cmdSearch});
				}

				if(userPerms.newDir) {
					items.push({icon:'fmIconFolderAdd',caption:fmMsg[lang].cmdNewDir,dialog:'fmNewDir'});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconFolderAdd fmIcon_dimmed',caption:fmMsg[lang].cmdNewDir});
				}

				if(userPerms.createFile) {
					items.push({icon:'fmIconFileCreate',caption:fmMsg[lang].cmdCreateFile,dialog:'fmCreateFile'});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconFileCreate fmIcon_dimmed',caption:fmMsg[lang].cmdCreateFile});
				}

				if(userPerms.upload) {
					switch(fmContSettings[curCont].uploadEngine) {
						case 'js':dialogId = 'fmFileDrop';break;
						case 'java':dialogId = 'fmJavaUpload';break;
						default:dialogId = 'fmNewFile';
					}
					items.push({icon:'fmIconUpload',caption:fmMsg[lang].cmdUploadFile,dialog:dialogId});
					items.push({icon:'fmIconDownloadUrl',caption:fmMsg[lang].cmdSaveFromUrl,dialog:'fmSaveFromUrl'});
				}
				else if(!userPerms.hideDisabledIcons) {
					items.push({icon:'fmIconUpload fmIcon_dimmed',caption:fmMsg[lang].cmdUploadFile});
					items.push({icon:'fmIconDownloadUrl fmIcon_dimmed',caption:fmMsg[lang].cmdSaveFromUrl});
				}
		}
		html = fmParser.parseMenu(items, curCont, id);
		this.curCont1 = curCont; //MP
		this.openDialog(null, 'fmMenu', [fmMsg[lang].cmdSelAction, html]);
	},

	newFileSelector: function(cnt) {
		var f = document.forms.fmNewFile;
		if(f && f['fmFile[' + cnt + ']']) f['fmFile[' + cnt + ']'].style.display = 'block';
	},

	deleteCheckedFiles: function(curCont, title, confirm, ids) {
		if(!ids) ids = fmTools.getSelectedItems(curCont);
		else if(typeof ids != 'object') ids = [ids];

		if(ids.length > 0) {
			var url = '?action&fmContainer=' + curCont;
			if(confirm) this.openDialog(url, 'fmDelete', [title, confirm], ids);
			else this.call(url + '&fmMode=delete&fmObject=' + ids.join(','));
		}
	},

	getCheckedFiles: function(curCont, ids) {
		if(!ids) ids = fmTools.getSelectedItems(curCont);
		else if(typeof ids != 'object') ids = [ids];

		if(ids.length > 0) {
			var iFrame = frames.fmFileAction;
			if(iFrame) {
				var url = '?action&fmContainer=' + curCont + '&fmMode=getFiles&fmObject=' + ids.join(',');
				iFrame.document.location.href = url;
				this.fadeOut(this.opacity, this.dialog);
			}
		}
	},

	moveCheckedFiles: function(curCont, title, ids) {
		if(!ids) ids = fmTools.getSelectedItems(curCont);
		else if(typeof ids != 'object') ids = [ids];

		if(ids.length > 0) {
			var url = '?action&fmContainer=' + curCont + '&fmMode=move&fmObject=' + ids.join(',');
			this.getExplorer(curCont, title, url);
		}
	},

	playAudio: function(url, name, cover, curCont) {
		var width = fmContSettings[curCont].mediaPlayerWidth;
		var height = fmContSettings[curCont].mediaPlayerHeight;
		var forceFlash = (this.useFlash || fmContSettings[curCont].forceFlash);
		var params;

		this.stopPlayback();

		if(forceFlash || ((name.match(/\.mp3$/i) || name.match(/\.m4a$/i)) && !fmTools.supportsMP3())) {
			/* not supported MP3/M4A files via Flash player */
			if(typeof FlashReplace == 'object') {
				if(cover) $$('fmMediaCont').style.background = 'url(' + cover + ') black no-repeat center';
				else $$('fmMediaCont').style.background = 'black';
				params = {FlashVars: 'file=' + encodeURI(url) + '&as=1', bgcolor: '#000', wmode: 'transparent'};
				FlashReplace.replace('fmMediaCont', fmWebPath + '/ext/niftyplayer/niftyplayer.swf', 'fmFlashMovie', '165', '38', 9, params);

				if($$('fmFlashMovieCont')) {
					$$('fmFlashMovieCont').style.position = 'relative';
					$$('fmFlashMovieCont').style.top = (height - 40) + 'px';
					$$('fmFlashMovieCont').style.left = parseInt((width - 165) / 2) + 'px';
				}
			}
		}
		else {
			/* other audio files via HTML5 */
			fmAudioPlayer = new Uppod({m:'audio',uid:'fmMediaCont',lang:'en',poster:cover});
			fmAudioPlayer.Play(url);
		}
	},

	playVideo: function(url, name, curCont) {
		var forceFlash = (this.useFlash || fmContSettings[curCont].forceFlash);
		var params;

		this.stopPlayback();

		if(name.match(/\.swf$/i)) {
			/* SWF files via Flash */
			if(typeof FlashReplace == 'object') {
				params = {bgcolor: '#000', allowFullScreen: 'true'};
				FlashReplace.replace('fmMediaCont', url, 'fmFlashMovie', '100%', '100%', 7, params);
			}
		}
		else if(forceFlash || (name.match(/\.flv$/i) || (name.match(/\.mp4$/i) && !fmTools.supportsMP4()))) {
			/* FLV files + not supported MP4 videos via Flash */
			if(typeof FlashReplace == 'object') {
				params = {FlashVars: 'fichier=' + encodeURI(url) + '&auto_play=true', bgcolor: '#000', allowFullScreen: 'true'};
				FlashReplace.replace('fmMediaCont', fmWebPath + '/ext/flvplayer/flvPlayer.swf', 'fmFlashMovie', '100%', '100%', 9, params);
			}
		}
		else {
			/* other video files via HTML5 */
			fmVideoPlayer = new Uppod({m:'video',uid:'fmMediaCont'});
			fmVideoPlayer.Play(url);
		}
	},

	stopPlayback: function() {
		if(fmAudioPlayer) fmAudioPlayer.Stop();
		if(fmVideoPlayer) fmVideoPlayer.Stop();

		if($$('fmMediaCont')) {
			$$('fmMediaCont').innerHTML = '';
			$$('fmMediaCont').style.background = 'black';
		}
	},

	switchMediaPlayer: function(useFlash, url) {
		this.useFlash = useFlash;
		this.stopPlayback();
		url.match(/fmObject=(\d+)/);
		this.openDialog(url, 'fmMediaPlayer', '', RegExp.$1);
	},

	setMediaPlayerIcon: function(url, curCont) {
		var icon, action, title;
		var lang = fmContSettings[curCont].language;
		var obj = $$('fmMediaPlayerSwitch');

		if(obj) {
			if(!fmContSettings[curCont].forceFlash) {
				if(this.useFlash) {
					icon = 'fmIconHtml5';
					action = "fmLib.switchMediaPlayer(false, '" + url + "')";
					title = fmMsg[lang]['cmdUseHtml5'];
				}
				else {
					icon = 'fmIconFlash';
					action = "fmLib.switchMediaPlayer(true, '" + url + "')";
					title = fmMsg[lang]['cmdUseFlash'];
				}
				obj.innerHTML = '<i class="' + icon + '" style="cursor:pointer" title="' + title + '" onClick="' + action + '"></i>';
				return true;
			}
			else obj.innerHTML = '';
		}
		return false;
	},

  setInputFocus: function(toggle) {
    this.inputFocus = toggle;
  }
}

//this is moved to ProcessFileManager.js
/*fmTools.addListener(document, 'mousemove', function(e) {
	var mouseX = fmLib.mouseX;
	var mouseY = fmLib.mouseY;

	if(e && e.pageX != null) {
		fmLib.mouseX = e.pageX;
		fmLib.mouseY = e.pageY;
	}
	else if(event && event.clientX != null) {
		fmLib.mouseX = event.clientX + fmTools.getScrollLeft();
		fmLib.mouseY = event.clientY + fmTools.getScrollTop();
	}
	if(fmLib.mouseX < 0) fmLib.mouseX = 0;
	if(fmLib.mouseY < 0) fmLib.mouseY = 0;

	if(fmLib.dragging && fmLib.dialog) {
		var x = parseInt(fmLib.dialog.style.left + 0);
		var y = parseInt(fmLib.dialog.style.top + 0);
		fmLib.dialog.style.left = x + (fmLib.mouseX - mouseX) + 'px';
		fmLib.dialog.style.top = y + (fmLib.mouseY - mouseY) + 'px';
	}
});

fmTools.addListener(document, 'mousedown', function(e) {
	var firedobj = (e && e.target) ? e.target : event.srcElement;
	if(firedobj.nodeType == 3) firedobj = firedobj.parentNode;

	if(firedobj.className) {
		var isTitle = (firedobj.className.indexOf('fmDialogTitle') != -1);
		var isDialog = (firedobj.className.indexOf('fmDialog') != -1 && !isTitle);

		//MP todo zakaj je to
		if(firedobj.className.indexOf('fmTH1') != -1 || isTitle) {
			fmTools.setUnselectable(firedobj, 'move');

			while(firedobj.tagName != 'HTML' && !isDialog) {
				firedobj = firedobj.parentNode;
				isTitle = (firedobj.className.indexOf('fmDialogTitle') != -1);
				isDialog = (firedobj.className.indexOf('fmDialog') != -1 && !isTitle);
			}

			if(firedobj.className.indexOf('fmDialog') != -1) {
				fmLib.dialog = firedobj;
				fmLib.dragging = true;
				fmLib.setOpacity(50, fmLib.dialog);
			}
		}
	}
});

fmTools.addListener(document, 'mouseup', function() {
	fmLib.dragging = false;
	fmLib.setOpacity(100, fmLib.dialog);
});
*/