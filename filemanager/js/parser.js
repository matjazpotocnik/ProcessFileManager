/*********************************************************************************************************
 This code is part of the FileManager software (www.gerd-tentler.de/tools/filemanager), copyright by
 Gerd Tentler. Obtain permission before selling this code or hosting it on a commercial website or
 redistributing it over the Internet or in any other medium. In all cases copyright must remain intact.
*********************************************************************************************************/

var fmParser = {

	imageFiles: /\.(jpe?g|png|gif)$/i,
	audioFiles: /\.(mp3|m4a|aac|wav|oga)$/i,
	videoFiles: /\.(swf|flv|mp4|webm|ogv)$/i,
	mediaCnt: 0,

	makeBreadcrumbs: function(path, url) {
		if(typeof path == 'undefined') path = '';
		var crumbsep = " / ";
		var displayname, allbread, path_ar, p;

		if(path.charAt(path.length - 1) == "/") {
			//remove trailing slash, if present
			path = path.substring(0, path.length - 1);
		}
		if(path.charAt(0) == '/') {
			// remove starting slash
			path = path.substring(1, path.length);
		}

		// start with root
		allbread = '<span class="fmLink" title="' + '/' + '" onClick="fmLib.call(\'' + url
						 + '&fmMode=expOpenPath&fmObject=' + '/' + '\')">'
						 + '<i class="fmIconHome"></i></span>\n';
		if(path == "" ) return allbread;

		path_ar = path.split('/');

		p = '';
		for (i=0; i < path_ar.length; i++) {
			p += "/" + path_ar[i];
			displayname = path_ar[i];
			if(i == path_ar.length-1) {
				//last part
				allbread += crumbsep + '<span title="">'
									+ displayname + '</span>\n';
			} else {
				// should urlencode path?
				allbread += crumbsep + '<span class="fmLink" title="' + p + '" onClick="fmLib.call(\''
									+ url + '&fmMode=expOpenPath&fmObject=' + p + '\')">'
									+ displayname + '</span>\n';
			}
		};

		return allbread;
	},

	shortenFilename: function(filename, allowed) {
    // get extension
    var fileSplit = filename.split(".");
    var extension = fileSplit.length > 1 ?
        '.' + fileSplit[fileSplit.length-1] : '';

    if(filename.length - extension.length > allowed) {
        var fileStart = filename.substring(0,allowed);
        return fileStart + '[...]' + extension;
    }
    else return filename;
	},

	// create html markup for the title
	parseTitle: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');

		var html, title, icon, dialogId;
		var lang = fmContSettings[json.cont].language;
		var userPerms = fmContSettings[json.cont].userPerms;
		var url = '?action&fmContainer=' + json.cont;
		var cntFiles = (fmContSettings[json.cont].hideFileCnt) ? '' : '<span class="fmExplorerFileCnt">' + ' (' + this._getFileCount(json.cont) + ')';

		if(typeof json.title != 'undefined' && json.title != '') {
			title = json.title;

			if(typeof json.path != 'undefined') {
				title += ' ' + json.path + cntFiles;
			}
		}
		else if(typeof json.search != 'undefined' && json.search != '') {
			title = fmMsg[lang].searchResult + ': ' + json.search;
		}
		else if(typeof json.sysType != 'undefined' && json.sysType != '') {
			title = '[' + json.sysType + '] ' + json.path + cntFiles;
		}
		else {
			title = this.makeBreadcrumbs(json.path, url);// + cntFiles;
		}

		html = '<div class="fmContTitlePath">' + title + '</div>\n';

		if(!json.login) {
			html += '<div class="fmContTitleActions">\n';
			html += '<i class="fmIconRefresh fmIcon" title="' + fmMsg[lang].cmdRefresh + '" onClick="fmLib.call(\'' + url + '&fmMode=refreshAll\')"></i>\n';

			if(fmContSettings[json.cont].listType == 'details') {
				title = fmMsg[lang].cmdIcons;
				icon = '<i class="fmIconViewIcons fmIcon"';
			}
			else {
				title = fmMsg[lang].cmdDetails;
				icon = '<i class="fmIconViewDetails fmIcon"';
			}
			html += icon + ' title="' + title + '" onClick="fmLib.toggleListView(\'' + json.cont + '\')"></i>\n';

			if(userPerms.restore) {
				if(fmContSettings[json.cont].viewDeleted) {
					title = fmMsg[lang].cmdHideDeleted;
					icon = '<i class="fmIconTrashbinOpen fmIcon"';
				}
				else {
					title = fmMsg[lang].cmdViewDeleted;
					icon = '<i class="fmIconTrashbinClosed fmIcon"';
				}
				html += icon + ' title="' + title + '" onClick="fmLib.call(\'' + url + '&fmMode=toggleDeleted\')"></i>\n';
			}

			if(userPerms['search']) {
				html += '<i class="fmIconSearch fmIcon" title="' + fmMsg[lang].cmdSearch + '" onClick="fmLib.openDialog(\'' + url + '\', \'fmSearch\', \'' + fmMsg[lang].cmdSearch + '\')"></i>\n';
			}

			if(userPerms.newDir) {
				html += '<span class="fa-stack" title="' + fmMsg[lang].cmdNewDir + '" onClick="fmLib.openDialog(\'' + url + '\', \'fmNewDir\', \'' + fmMsg[lang].cmdNewDir + '\')"><i class="fmIconDir fa-stack-1x fmIcon" /*style="margin-left:0"*/></i><i class="fmIconPlus fa-stack-1x"></i></span>\n';
			}

			if(userPerms.createFile) {
				html += '<span class="fa-stack" title="' + fmMsg[lang].cmdCreateFile + '" onClick="fmLib.openDialog(\'' + url + '\', \'fmCreateFile\', \'' + fmMsg[lang].cmdCreateFile + '\')"><i class="fmIconFile fa-stack-1x fmIcon" /*style="margin-left:0"*/></i><i class="fmIconPlus fa-stack-1x"></i></span>\n';
			}

			if(userPerms.upload) {
				switch(fmContSettings[json.cont].uploadEngine) {
					case 'js': dialogId = 'fmFileDrop'; break;
					case 'java': dialogId = 'fmJavaUpload'; break;
					default: dialogId = 'fmNewFile';
				}
				html += '<i class="fmIconUpload fmIcon" title="' + fmMsg[lang].cmdUploadFile + '" onClick="fmLib.openDialog(\'' + url + '\', \'' + dialogId + '\', \'' + fmMsg[lang].cmdUploadFile + '\')"></i>\n';

				html += '<i class="fmIconDownload fmIcon" title="' + fmMsg[lang].cmdSaveFromUrl + '" onClick="fmLib.openDialog(\'' + url + '\', \'fmSaveFromUrl\', \'' + fmMsg[lang].cmdSaveFromUrl + '\')"></i>\n';
			}
			html += '</div>\n';
		}
		if(contObj) contObj.innerHTML = html;
		return true;
	},

	parseMain: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');

		var clickArea = contObj;
		var html, id;

		if(json.login) {
			html = this.parseLogin(json);
		}
		else if(json.entries) {
			switch(fmContSettings[json.cont].listType) {
				case 'details': html = this.parseEntriesDetailView(json); break;
				case 'icons': html = this.parseEntriesIconView(json); break;
				default: html = 'Unknown list type';
			}
			fmLib.setInputFocus(false);
		}
		if(html) contObj.innerHTML = html;

		if(fmContSettings[json.cont].listType == 'details') {
			id = json.cont + '_detBody';

			try {
				var cHead = $$(json.cont + '_detHead');
				var cBody = $$(json.cont + '_detBodyTable');
				var hDivs = cHead.getElementsByTagName('div');
				var bTr = cBody.getElementsByTagName('tr')[0];
				var bTds = bTr.getElementsByTagName('td');

				//MP last item first
				hDivs[hDivs.length-1].style.width = (bTds[hDivs.length-1].offsetWidth - 1) + 'px';

				for(var i = 0; i < hDivs.length-1; i++) {
					//MP instead of left margin 1px on fmContDetHead
					if(i == 0) hDivs[i].style.width = (bTds[i].offsetWidth + 1) + 'px';
					else hDivs[i].style.width = bTds[i].offsetWidth + 'px';
				}
				clickArea = cBody;
			}
			catch(e) {}
		}
		else {
			id = json.cont + 'Entries';
			clickArea = contObj.childNodes[0];
		}

		if(!json.login) {
			fmTools.touchScroll(id);

			fmTools.addListener(clickArea, 'mouseup', function(e) {
				if($$('fmMenu').style.visibility != 'visible') {
					var target;
					if(!e) e = event;
					if(e.target) target = e.target;
					else target = e.srcElement;

					if(target.type != 'checkbox') {
						if(fmLib.useRightClickMenu[json.cont] && e.button == 2) {
							fmLib.viewMenu(-1, json.cont);
						}
						else if(!fmLib.useRightClickMenu[json.cont] && e.button != 2) {
							fmLib.viewMenu(-1, json.cont);
						}
					}
				}
				return true;
			});
		}
		return true;
	},

	// create html markup for the main window - details view
	parseEntriesDetailView: function(json) {
		if(typeof json != 'object') return '';
		if(!json.entries) return '';

		var html, i, j, action, cssRow, cssData, style, content, tooltip, img, order, caption;
		var entries = json.entries;
		var userPerms = fmContSettings[json.cont].userPerms;
		var lang = fmContSettings[json.cont].language;
		var cw = [];
		var cwLastCol = (userPerms.remove || userPerms.bulkDownload || !userPerms.hideDisabledIcons) ? 20 : 0;
		var listCont = $$(json.cont + 'List');
		listCont.innerHTML = ''; //MP must empty the content so that width is correctly recalculated
		var twidth = listCont.offsetWidth - 16; //MP the width of the scrollbar?
		var theight = listCont.offsetHeight;
		var fmContDetHeadHeight = 26; //MP the head height - if you change the height in css, you must change it here too!!
		var timestamp = Math.round((new Date()).getTime() / 1000);
		cssData = '';

		// calculate the widths of columns
		for(i in entries.captions) {
			switch(entries.captions[i]) {
				case 'isDir':
					cw[i] = 30;
					break;
				case 'name':
					if(entries.captions.length > 2) {
						cw[i] = Math.floor((twidth - cwLastCol) / entries.captions.length * 1.8);
					}
					else cw[i] = twidth - cwLastCol - 35;
					break;
				case 'size':
				case 'owner':
				case 'group':
					if(entries.captions.length > 3) {
						cw[i] = Math.floor((twidth - cwLastCol) / entries.captions.length * 0.6);
					}
					break;
				case 'changed':
					if(entries.captions.length > 3) {
						cw[i] = Math.floor((twidth - cwLastCol) / entries.captions.length * 1.3);
					}
					break;
			}
		}
		var cwOther = Math.floor((twidth - cwLastCol - 30 - fmTools.arraySum(cw)) / (entries.captions.length - cw.length));

		// header
		cssRow = (json.search != '') ? 'fmSearchResult' : '';
		html = '<div id="' + json.cont + '_detHead" class="fmContDetHead">\n';

		for(i in entries.captions) {
			if(!cw[i]) cw[i] = cwOther;
			if(entries.captions[i] == 'isDir') tooltip = caption = '';
			else tooltip = caption = fmMsg[lang][entries.captions[i]];
			if(tooltip != '') tooltip += ': ';

			if(entries.captions[i] == fmContSettings[json.cont].sort.field) {
				if(fmContSettings[json.cont].sort.order == 'asc') {
					img = 'fmIconSortAsc';
					order = 'desc';
					tooltip += fmMsg[lang].cmdSortDesc;
				}
				else {
					img = 'fmIconSortDesc';
					order = 'asc';
					tooltip += fmMsg[lang].cmdSortAsc;
				}
			}
			else {
				img = '';
				order = 'asc';
				tooltip += fmMsg[lang].cmdSortAsc;
			}
			action = "fmLib.sortList('" + json.cont + "', '" + entries.captions[i] + "', '" + order + "')";
			style = 'width:' + cw[i] + 'px;';
			if(i == 0) style = 'width:' + (cw[i] + 1) +'px;'; //MP first column in header needs one extra pixel
			html += '<div style="' + style + '" title="' + tooltip + '" onClick="' + action + '">\n';
			if(img != '') html += '<i class="' + img + '"></i>';
			if(caption != '') html += ((img != '') ? '&nbsp;' : '') + caption;
			html += '</div>';
		}

		// menu
		if(cwLastCol > 0) {
			action = this.parseAction(entries.lastCol, json.cont);
			html += '<div style="width:' + cwLastCol + 'px;">';
			html += '<i class="' + entries.lastCol.icon + '" style="' + entries.lastCol.style + '" title="' + entries.lastCol.tooltip + '" onClick="' + action + '"></i>';
			html += '</div>\n';
		}
		html += '</div>\n';

		// div and table with folders and files
		html += '<div id="' + json.cont + '_detBody" class="fmContBody" style="height:' + (theight - fmContDetHeadHeight) + 'px">\n'; //height is needed!!!!
		html += '<table id="' + json.cont + '_detBodyTable" class="fmContBodyTable" border="0" cellspacing="1" cellpadding="0" width="100%">\n';

		// empty line on top for the "select all" checkbox
		if (cwLastCol > 0 && entries.items[0] && entries.items[0].id) {
			html += '<tr>\n';
			for(j in entries.captions) html += '<td class="' + cssData + '">&nbsp;</td>\n';
			html += '<td width="' + cwLastCol + '" class="' + cssData + '" align="center">';
			html += '<input type="checkbox" style="margin:0" onClick="fmTools.selectAll(this, \'' + json.cont + '\')" value="" />';
			html += '</td>\n';
			html += '</tr>\n';
		}

		// entries
		for(i in entries.items) {
			fmEntries[json.cont][entries.items[i].id] = entries.items[i];
			action = this._checkAction(entries.items[i], json);

			if(entries.items[i].deleted) {
				cssData = 'class="fmContentDeleted"';
			}
			else if(fmContSettings[json.cont].markNew && entries.items[i].changedTimeStamp > timestamp - 24 * 3600) {
				cssData = 'class="fmContentNew"';
			}
			else cssData = '';

			html += '<tr>\n';
			for(j in entries.captions) {
				switch(entries.captions[j]) {
					case 'isDir':
						content = '<i class="' + entries.items[i].icon + '"></i>';
						style = 'text-align:center';
						tooltip = '';
						break;
					case 'name':
						content = tooltip = entries.items[i].name;
						style = 'text-align:left';
						content = this.shortenFilename(content, parseInt(cw[j] / 8.5)); //MP for 13px font size
						break;
					case 'size':
						content = tooltip = entries.items[i].size;
						style = 'text-align:right';
						break;
					default:
						content = tooltip = entries.items[i][entries.captions[j]];
						style = 'text-align:center';
				}
				html += '<td title="' + tooltip + '" onMouseDown="' + action + '" align="left">';
				html += '<div ' + cssData + ' style="width:' + cw[j] + 'px;' + style + '">' + content + '</div>';
				html += '</td>\n';
			}

			if(cwLastCol > 0) {
				html += '<td width="' + cwLastCol + '" align="center">';
				html += '<input type="checkbox" value="' + entries.items[i].id + '"';
				if(entries.items[i].id == '') html += ' onClick="fmTools.selectAll(this, \'' + json.cont + '\')" />';
				else if(entries.items[i].deleted) html += ' disabled="disabled" />';
				else html += ' />';
				html += '</td>\n';
			}
			html += '</tr>\n';
		}
		html += '</table>\n';
		html += '</div>\n';

		return html;
	},

	// create html markup for the main window - icons view
	parseEntriesIconView: function(json) {
		if(typeof json != 'object') return '';
		if(!json.entries) return '';

		var html, i, action, cssRow, cssData, cssIcon, thumbWidth, thumbHeight, perc, name, img, cellsPerRow, cellWidth, isImage, isDeleted;
		var url = '?action&fmContainer=' + json.cont;
		var entries = json.entries;
		var cellCnt = 0;
		var listCont = $$(json.cont + 'List');
		listCont.innerHTML = ''; //MP must empty the content so that width is correctly recalculated
		var listWidth = listCont.offsetWidth;
		var timestamp = Math.round((new Date()).getTime() / 1000);

		cellsPerRow = listWidth / 130;
		cellWidth = Math.ceil(listWidth / cellsPerRow) - 14;
		cellsPerRow = Math.floor(cellsPerRow);
		cssRow = (json.search != '') ? 'fmSearchResult' : 'fmContBodyTableIconsTd';

		html = '<table width="100%" class="fmContBodyTableIcons">\n';
		html += '<colgroup>\n';

		for(i = 0; i < cellsPerRow; i++) {
			html += '<col width="' + cellWidth + 'px"/>\n';
		}
		html += '</colgroup>\n';
		html += '<tr class="fmContBodyTableIconsTr">\n';

		for(i in entries.items) {
			fmEntries[json.cont][entries.items[i].id] = entries.items[i];
			action = this._checkAction(entries.items[i], json);
			isDeleted = entries.items[i].deleted;
			
			if(isDeleted) {
				cssData = 'class="fmContentDeleted"';
			}
			else if(fmContSettings[json.cont].markNew && entries.items[i].changedTimeStamp > timestamp - 24 * 3600) {
				cssData = 'class="fmContentNew"';
			}
			else cssData = '';

			if(cellCnt >= cellsPerRow) {
				html += '</tr>\n<tr class="fmContBodyTableIconsTr">\n';
				cellCnt = 0;
			}
			isImage = entries.items[i].name.match(this.imageFiles);
			cssIcon = (isImage || entries.items[i].id3.Picture) ? 'fmThumbnail' : '';

			html += '<td class="' + cssRow + '" onMouseDown="' + action + '">\n';
			html += '<table border="0" cellspacing="0" cellpadding="0" width="100%">\n';
			html += '<tr>\n';
			html += '<td class="' + cssIcon + '" style="height:54px">';

			if(entries.items[i].id3.Picture) {
				thumbWidth = cellWidth;
				thumbHeight = 50;
				name = entries.items[i].id3.Picture.split(':')[0];
				img = url + '&fmMode=getCachedImage&fmObject=' + name + '&width=' + thumbWidth + '&height=' + thumbHeight;
				html += '<div style="height:' + thumbHeight + 'px; background:url(' + img + ') center no-repeat"></div>';
			}
			else if(isImage && !isDeleted) {
				thumbWidth = entries.items[i].width;
				thumbHeight = entries.items[i].height;

				if(thumbWidth > cellWidth) {
					perc = cellWidth / thumbWidth;
					thumbWidth = cellWidth;
					thumbHeight = Math.round(thumbHeight * perc);
				}

				if(thumbHeight > 50) {
					perc = 50 / thumbHeight;
					thumbWidth = Math.round(thumbWidth * perc);
					thumbHeight = Math.round(thumbHeight * perc);
				}
				img = url + '&fmMode=getThumbnail&fmObject=' + entries.items[i].id + '&width=' + thumbWidth + '&height=' + thumbHeight + '&hash=' + entries.items[i].hash;
				html += '<div style="height:' + thumbHeight + 'px; background:url(' + img + ') center no-repeat"></div>';
			}
			else {
				img = '<i class="' + entries.items[i].icon + ' fmIcon_large"></i>'
				thumbHeight = 50;
				html += img;
			}
			html += '</td>\n';
			html += '</tr><tr>\n';
			html += '<td>\n';
			html += '<div ' + cssData + ' style="max-width:' + (cellWidth + 14) + 'px" title="' + entries.items[i].name + '">' + entries.items[i].name + '</div>\n';
			html += '</td>\n';
			html += '</tr></table>\n';
			html += '</td>\n';
			cellCnt++;
		}

		while(cellCnt < cellsPerRow) {
			html += '<td class="fmContBodyTableIconsEmpty">&nbsp;</td>\n';
			cellCnt++;
		}
		html += '</tr></table>\n';
		return html;
	},

	// create html markup for the explorer window
	parseExplorer: function(json, link) {
		if(typeof json != 'object') return '';
		if(!json.explorer) return '';

		var url, action, icon, icon2, style, hash, caption, i, j, cls, isCurDir, cntFiles;
		var html = '';
		var explorer = json.explorer;
		var lang = fmContSettings[json.cont].language;
		// if you change titleHeight in css, you have to change here too, but give a few pixels more
		var fmExplorerTitleHeight = 25;
		fmContSettings[json.cont].expJson = json;

		if(typeof fmContSettings[json.cont].expanded != 'object') {
			fmContSettings[json.cont].expanded = {};

			for(i = 0; i < explorer.items.length; i++) {
				hash = explorer.items[i].hash;
				if(explorer.expandAll || explorer.items[i].level == 1) {
					fmContSettings[json.cont].expanded[hash] = true;
				}
			}
		}

		if(!link && $$(json.cont + 'Exp')) {
			caption = fmMsg[lang].usage + ': ' + fmTools.bytes2string(explorer.totalSize, 1);
			if(fmContSettings[json.cont].quota) {
				caption += ' / ' + fmTools.bytes2string(fmContSettings[json.cont].quota, 1);
			}
			html += '<div class="fmExplorerTitle" title="' + caption + '">' + caption + '</div>';
			html += '<div style="height:' + ($$(json.cont + 'Exp').offsetHeight - fmExplorerTitleHeight) + 'px;overflow:auto">'; //needed !!!!
		}

		for(i = 0; i < explorer.items.length; i++) {
			if(explorer.items[i].deleted) continue;

			if(typeof explorer.items[i].cntReload == 'undefined') {
				explorer.items[i].cntReload = 0;
			}
			if(link) url = link + '&fmName=' + explorer.items[i].id;
			else url = '?action&fmContainer=' + json.cont + '&fmMode=expOpen&fmObject=' + explorer.items[i].id;

			if(explorer.items[i-1] && explorer.items[i-1].level < explorer.items[i].level) {
				hash = explorer.items[i-1].hash;

				if(!fmContSettings[json.cont].expanded[hash]) {
					html += '<div id="' + json.cont + '|' + hash + '" style="display:none">';
				}
				else html += '<div id="' + json.cont + '|' + hash + '">';
			}
			isCurDir = (explorer.items[i].path == fmContSettings[json.cont].listJson.path);
			cls = isCurDir ? 'fmExplorerActive' : 'fmExplorer';
			html += '<div class="' + cls + '">';

			if(explorer.items[i].level > 1) for(j = 1; j < explorer.items[i].level; j++) {
				html += '<i class="fmIconBlank"></i>';
			}

			if(explorer.items[i+1] && explorer.items[i+1].level > explorer.items[i].level) {
				hash = explorer.items[i].hash;
				if(fmContSettings[json.cont].expanded[hash]) {
					icon = "<i class='fmIconTreeClose'";
					icon2 = "<i class='fmIconDirOpen'";
				}
				else {
					icon = "<i class='fmIconTreeOpen'";
					icon2 = "<i class='fmIconDirClose'";
				}
				action = 'fmLib.toggleTreeItem(this)';
				style = 'cursor:pointer';
			}
			else {
				icon = "<i class='fmIconBlank'";
				icon2 = "<i class='fmIconDirClose'";
				action = style = '';
			}

			if(typeof fmContSettings[json.cont].listJson.search != 'undefined') {
				if(isCurDir && fmContSettings[json.cont].listJson.search == '') {
					cntFiles = this._getFileCount(json.cont);

					if(cntFiles != explorer.items[i].files) {
						explorer.items[i].files = cntFiles;

						if(explorer.items[i].cntReload < 2) {
							/* ugly workaround: if number of files doesn't match, reload */
							fmLib.call('?action&fmContainer=' + json.cont + '&fmMode=refreshAll');
							explorer.items[i].cntReload++;
						}
					}
				}
			}
			caption = explorer.items[i].name + ' (' + explorer.items[i].files + ')';
			html += icon + ' onClick="' + action + '" style="' + style + '"></i>';
			html += icon2 + ' id="' + (!link ? json.cont + 'DirIcon' + i : '') + '" onClick="fmLib.call(\'' + url + '\')" style="cursor:pointer"></i>';
			html += '<span class="fmExplorerContent" onClick="fmLib.call(\'' + url + '\')" style="cursor:pointer" title="' + caption + '">' + explorer.items[i].name;
			html += (fmContSettings[json.cont].hideFileCnt ? '' : ' <span class="fmExplorerFileCnt">(' + explorer.items[i].files + ')</span>');
			html += '</span></div>';

			if(explorer.items[i+1] && explorer.items[i+1].level < explorer.items[i].level) {
				for(j = 0; j < explorer.items[i].level - explorer.items[i+1].level; j++) {
					html += '</div>';
				}
			}
		}
		if(!link) html += '</div>';
		fmTools.touchScroll(json.cont + 'Exp');
		return html;
	},

	parseEditor: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');

		var btn = $$('fmEditorButton'); //save button top
		var btn1 = $$('fmEditorButton1'); //save button bottom
		var title = $$('fmEditorText');
		var lang = fmContSettings[json.cont].language;

		if(btn && btn.innerHTML == '') {
			btn.innerHTML = '<i class="fmIconSave" style="cursor:pointer" title="' + fmMsg[lang].cmdSave + '" onClick="fmLib.callSave(\'' + fmMsg[lang].msgSaveFile + '\', \'\', \'frmEdit\')"></i>';
		}
		//if(btn1 && btn1.innerHTML == '') {
		if(btn1) {
			btn1.innerHTML = '<span class="ui-button-text" style="cursor:pointer" title="' + fmMsg[lang].cmdSave + '" onClick="fmLib.callSave(\'' + fmMsg[lang].msgSaveFile + '\', \'\', \'frmEdit\')">' + fmMsg[lang].cmdSave + '</span>';
		}

		if(title && json.text.encoding) {
			title.innerHTML += ' [' + json.text.encoding + ']';
		}
		title.innerHTML += '<span id="fmEditorChange"></span>'; // change indicator

		var html;
		var url = '?action&fmContainer=' + json.cont;
		var width = fmContSettings[json.cont].docViewerWidth;
		var height = fmContSettings[json.cont].docViewerHeight;

		html = '<form name="frmEdit" class="fmForm" action="javascript:fmLib.call(\'' + url + '\', \'frmEdit\')" method="post">\n';
		html += '<input type="hidden" name="fmMode" value="edit" />\n';
		html += '<input type="hidden" name="fmObject" value="' + json.id + '" />\n';
		html += '<textarea name="fmText" ';
		//MP don't forget newline before json.text.content in textarea!!!
		html += 'class="codeedit ' + json.text.lang + ' lineNumbers focus" wrap="off">\n' + json.text.content + '</textarea>\n';
		html += '<div id="fmEditorMonaco"></div></form>\n';

		contObj.innerHTML = html;
		return true;
	},

	parseTextViewer: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');

		var html;
		var width = fmContSettings[json.cont].docViewerWidth;
		var height = fmContSettings[json.cont].docViewerHeight;
		var title = $$('fmDocViewerText');

		if(title && json.text.encoding) {
			title.innerHTML += ' [' + json.text.encoding + ']';
		}

		html = '<textarea name="fmText" ';
		html += 'class="codeedit ' + json.text.lang + ' lineNumbers focus" wrap="off">\n' + json.text.content + '</textarea>\n';

		contObj.innerHTML = html;
		return true;
	},

	parseLogin: function(json) {
		return ''; //MP we don't use this
		if(typeof json != 'object') return '';
		if(!json.login) return '';

		var html;
		var action = this.parseAction(json.login, json.cont);
		var lang = fmContSettings[json.cont].language;

		html =  '<div class="fmxTH3" style="height:100%; padding:4px">\n';
		html += '<div style="position:relative; width:180px; top:50%; left:50%; margin-top:-30px; margin-left:-90px; text-align:center">\n';
		html += '<form name="' + json.cont + 'Login" action="javascript:' + action + '" class="fmForm" method="post">\n';
		html += '<input type="hidden" name="fmMode" value="login" />\n';
		html += '<input type="password" name="fmName" size="20" maxlength="60" class="fmField" onFocus="fmLib.setInputFocus(true)" onBlur="fmLib.setInputFocus(false)" /><br />\n';
		html += '<input type="checkbox" name="fmRememberPwd" value="1" />' + fmMsg[lang].rememberPwd + '<br />\n';
		html += '<input type="submit" class="fmButton" value="' + fmMsg[lang].cmdLogin + '" />\n';
		html += '</form>\n';
		html += '</div>\n';
		html += '</div>\n';
		return html;
	},

	parseDebugInfo: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');
		if(!json.debug) return false;

		var html;

		html =  '<table border="0" cellspacing="0" cellpadding="2">\n';
		html += '<tr valign="top">\n';
		html += '<td>Session cookie:</td><td>' + json.debug.cookie + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>PHP version:</td><td>' + json.debug.phpVersion + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Perl version:</td><td>' + json.debug.perlVersion + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$perlEnabled:</td><td>' + json.debug.perlEnabled + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Memory limit:</td><td>' + json.debug.memoryLimit + '</td>\n';
		html += '</tr><tr valign="top">\n';

		if(json.debug.memoryUsage) {
			html += '<td>Memory usage:</td><td>' + json.debug.memoryUsage + '</td>\n';
			html += '</tr><tr valign="top">\n';
		}
		html += '<td>FileManager::$language:</td><td>' + json.debug.lang + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$locale:</td><td>' + json.debug.locale + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$encoding:</td><td>' + json.debug.encoding + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$uploadEngine:</td><td>' + json.debug.uploadEngine + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$quota:</td><td>' + json.debug.quota + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$fmWebPath:</td><td>' + json.debug.webPath + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$rootDir:</td><td>' + json.debug.rootDir + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$tmpDir:</td><td>' + json.debug.tmpDir + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Listing::$curDir:</td><td>' + json.debug.curDir + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Listing::$searchString:</td><td>' + json.debug.search + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$maxImageWidth:</td><td>' + json.debug.maxImageWidth + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$maxImageHeight:</td><td>' + json.debug.maxImageHeight + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$forceFlash:</td><td>' + json.debug.forceFlash + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>FileManager::$smartRefresh:</td><td>' + json.debug.refresh + '</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Cache directory:</td><td>' + json.debug.cache + ' files</td>\n';
		html += '</tr><tr valign="top">\n';
		html += '<td>Explorer from cache:</td><td>' + json.debug.explorerFromCache + '</td>\n';
		html += '</tr></table>\n';

		contObj.innerHTML = html;
		return true;
	},

	parseLogMessages: function(json, contObj) {
		if(typeof contObj != 'object') return false;
		if(typeof json != 'object') json = eval('(' + json + ')');
		if(!json.messages) return false;

		var cssLog, i, msg;
		var html = '';

		for(i = 0; i < json.messages.length; i++) {
			msg = json.messages[i];
			cssLog = 'fmLog' + msg.type.substr(0, 1).toUpperCase() + msg.type.substr(1, msg.type.length);
			html += '<table border="0" cellspacing="0" cellpadding="0"><tr valign="top">';
			html += '<td class="' + cssLog + '" style="padding-right:10px; white-space:nowrap">' + msg.time + '</td>';
			html += '<td class="' + cssLog + '">' + msg.text + '</td>';
			html += '</tr></table>\n';
		}
		contObj.innerHTML += html;
		contObj.scrollTop = contObj.scrollHeight;
		fmTools.touchScroll(contObj);
		return true;
	},

	parseMediaPlayer: function(json) {
		if(typeof json != 'object') json = eval('(' + json + ')');

		var name = fmEntries[json.curCont][json.id].name;
		var width, height, maxWidth, img, cover;

		if(name.match(this.audioFiles)) {
			img = fmEntries[json.curCont][json.id].id3.Picture;

			if(img && fmContSettings[json.curCont].mediaPlayerHeight >= 100) {
				width = parseInt(fmEntries[json.curCont][json.id].width);
				height = parseInt(fmEntries[json.curCont][json.id].height);
				maxWidth = fmContSettings[json.curCont].mediaPlayerWidth;

				if(width > maxWidth) {
					width = maxWidth;
					height = Math.round(height * (maxWidth / width));
				}
				cover = '?action&fmContainer=' + json.curCont + '&fmMode=getCachedImage&fmObject=' + img + '&width=' + width + '&height=' + height;
			}
			else cover = '';

			fmLib.playAudio(json.url, name, cover, json.curCont);

			fmLib.mpIv = setInterval(function() {
				if($$('fmMediaPlayerText')) {
					var mId3 = fmEntries[json.curCont][json.id].id3;
					var content = $$('fmMediaPlayerText').innerHTML;
					var txt = 'n/a';

					switch(content.substring(0, content.indexOf(':'))) {
						case 'File':
							if(mId3.Title) txt = mId3.Title;
							$$('fmMediaPlayerText').innerHTML = 'Title: ' + txt;
							break;

						case 'Title':
							if(mId3.Artist) txt = mId3.Artist;
							$$('fmMediaPlayerText').innerHTML = 'Artist: ' + txt;
							break;

						case 'Artist':
							if(mId3.Album) txt = mId3.Album;
							$$('fmMediaPlayerText').innerHTML = 'Album: ' + txt;
							break;

						case 'Album':
							if(mId3.Year) txt = mId3.Year;
							$$('fmMediaPlayerText').innerHTML = 'Year: ' + txt;
							break;

						default:
							$$('fmMediaPlayerText').innerHTML = 'File: ' + name;
					}
				}
				else clearInterval(fmLib.mpIv);
			}, 3000);
		}
		else if(name.match(this.videoFiles)) {
			fmLib.playVideo(json.url, name, json.curCont);
		}
		return true;
	},

	parseFileInfo: function(curCont, id, lang) {
		var icon = css = style = name = tags = id3Picture = action = '';
		var thumbWidth = thumbHeight = 0;
		var id3, key;
		var size = fmEntries[curCont][id].size;

		if(fmEntries[curCont][id].type == 'image' && fmEntries[curCont][id].width) {
			size += ' (' + fmEntries[curCont][id].width + ' &times; ' + fmEntries[curCont][id].height + ')';
		}

		var html = '<table border="0" cellspacing="0" cellpadding="1" width="100%"><tr align="left" valign="top">' +
			'<td class="fmContent"><b>' + fmMsg[lang].name + ':</b></td><td class="fmContent">' + fmEntries[curCont][id].fullName + '</td>' +
			'</tr><tr align="left" valign="top">' +
			'<td class="fmContent"><b>' + fmMsg[lang].permissions + ':</b></td><td class="fmContent" id="fmPermissions">' + fmEntries[curCont][id].permissions + '</td>' +
			'</tr><tr align="left" valign="top">';
			if(fmContSettings[curCont].isWin == 1) {
				html += '<td class="fmContent"><b>' + 'Acl' + ':</b></td><td class="fmContent" id="fmAcl">' + fmEntries[curCont][id].permissions + '</td>' +
								'</tr><tr align="left">';
			}
			html += '<td class="fmContent"><b>' + fmMsg[lang].owner + ':</b></td><td class="fmContent" id="fmOwner">' + fmEntries[curCont][id].owner + '</td>' +
							'</tr><tr align="left">';
			if(fmContSettings[curCont].isWin == 0) {
				html += '<td class="fmContent"><b>' + fmMsg[lang].group + ':</b></td><td class="fmContent">' + fmEntries[curCont][id].group + '</td>' +
								'</tr><tr align="left">';
			}
			html += '<td class="fmContent"><b>' + fmMsg[lang].changed + ':</b></td><td class="fmContent" nowrap="nowrap">' + fmEntries[curCont][id].changed + '</td>' +
			'</tr><tr align="left">' +
			'<td class="fmContent"><b>' + fmMsg[lang].size + ':</b></td><td class="fmContent" nowrap="nowrap">' + size + '</td>';

		if(fmContSettings[curCont].isWin == 1) {
			var url = '?action&fmContainer=' + curCont + '&fmMode=getAcl&fmObject=' + id; // + '&hash=' + fmEntries[curCont][id].hash;
			var ajaxObj3 = new ajax();
			ajaxObj3.makeRequest(url, function() {
				var json = eval('(' + ajaxObj3.response + ')');
				$$('fmOwner').innerHTML = json.owner;
				$$('fmAcl').innerHTML = json.acl;
				$$('fmPermissions').innerHTML = json.perms;
				// reposition the modal since it has grown in height
				//fmLib.setDialogLeft(null, $$('fmInfo'), $$(fmLib.curCont1));
				fmLib.setDialogTop(null, $$('fmInfo'), $$(fmLib.curCont1));
			});
		}

		if(typeof fmEntries[curCont][id].id3 == 'object') {
			id3 = fmEntries[curCont][id].id3;

			for(key in id3) {
				if(key == 'Picture') {
					id3Picture = id3[key];
				}
				else if(id3[key] != '') {
					tags += '</tr><tr align="left">';
					tags +=	'<td class="fmContent"><b>' + key + ':</b></td><td class="fmContent" nowrap="nowrap">' + id3[key] + '</td>';
				}
			}

			if(tags) {
				html += '</tr><tr align="left">';
				html += '<td class="fmContent" colspan="2"><div style="height:0; margin:4px 0; border:1px inset #FFF"></div></td>';
				html += tags;
			}
		}

		if(fmEntries[curCont][id].type == 'image' || id3Picture) {
			if(id3Picture) {
				//MP when viewing mp3 file info
				icon = '?action&fmContainer=' + curCont + '&fmMode=getCachedImage&fmObject=' + id3Picture + '&width=100&height=100';
				icon = '<img src="' + icon + '"/>';
				css = 'fmThumbnail';
				style = 'width:100px;height:100px;box-shadow:3px 3px 4px #808080';
				action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmCoverViewer',content:id3Picture}, curCont, id);
			}
			else {
				thumbWidth = fmEntries[curCont][id].width;
				thumbHeight = fmEntries[curCont][id].height;

				if(thumbWidth > 100) {
					thumbHeight = Math.round(thumbHeight * 100 / thumbWidth);
					thumbWidth = 100;
				}

				if(thumbHeight > 100) {
					thumbWidth = Math.round(thumbWidth * 100 / thumbHeight);
					thumbHeight = 100;
				}
				icon = '?action&fmContainer=' + curCont + '&fmMode=getThumbnail&fmObject=' + id + '&width=' + thumbWidth + '&height=' + thumbHeight + '&hash=' + fmEntries[curCont][id].hash;
				icon = '<img src="' + icon + '"/>';
				css = 'fmThumbnail';
				style = 'width:' + thumbWidth + 'px;height:' + thumbHeight + 'px;background-color:#FFF;cursor:pointer';
				action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmImgViewer'}, curCont, id);
			}
		}
		else {
			icon = fmEntries[curCont][id].icon + ' fmIcon_large';
			icon = '<i class="' + icon + '"></i>';
			width = height = 32;
			style = "padding-top:20px;border-top:1px solid #ddd";
		}
		html += '</tr><!--<tr align="left"><td colspan="2" height="8"></td></tr>--><tr>' +
				'<td colspan="2" align="center">' +
				'<div class="' + css + '" style="' + style + '" onClick="' + action + '">' +
				icon + '</div></td>';
		html += '</tr></table>';
		return html;
	},

	parseAction: function(json, curCont, id) {
		if(typeof json != 'object') return '';

		var url = '?action&fmContainer=' + curCont;
		var i, params, caption;
		var action = name = '';

		if(json.call) {
			action = "fmLib.call('" + url + '&fmMode=' + json.call;
			if(id >= 0) action += '&fmObject=' + id;
			action += "')";
		}
		else if(json.window) {
			action = "window.open('" + url + '&fmMode=' + json.window;
			if(id >= 0) action += '&fmObject=' + id;
			action += "', 'PDF').focus()";
		}
		else if(json.submit) {
			action = "fmLib.call('" + url + "', '" + json.submit + "')";
		}
		else if(json.exec) {
			for(i = 1, params = []; i < json.exec.length; i++) {
				if(typeof json.exec[i] == 'object') {
					params.push("['" + json.exec[i].join("','") + "']");
				}
				else if(typeof json.exec[i] == 'string') {
					params.push("'" + json.exec[i].replace(/\'/g, "\\'") + "'");
				}
			}
			action = json.exec[0] + '(' + params.join(',') + ')';
		}
		else if(json.dialog) {
			if(json.dialog == 'fmError') {
				for(i in json.caption) json.caption[i] = json.caption[i].replace(/\'/g, "\\'");
				action = "fmLib.openDialog('', 'fmError', ['" + json.caption[0] + "', '" + json.caption[1] + "'])";
			}
			else if(fmTools.inArray(json.dialog, ['fmSearch', 'fmNewDir', 'fmCreateFile', 'fmSaveFromUrl', 'fmFileDrop', 'fmJavaUpload', 'fmNewFile'])) {
				caption = json.caption.replace(/\'/g, "\\'");
				action = "fmLib.openDialog('" + url + "', '" + json.dialog + "', '" + caption + "')";
			}
			else {
				if(json.dialog == 'fmMediaPlayer') {
					url += '&fmMode=loadFile&fmObject=' + id + '&hash=' + fmEntries[curCont][id].hash;
				}
				caption = [json.caption + (id ? ': ' + fmEntries[curCont][id].name : '')];
				if(json.confirm) caption.push(json.confirm);
				if(json.text) for(i = 0; i < json.text.length; i++) {
					caption.push(json.text[i]);
				}
				if(typeof json.content != 'undefined') name = json.content;
				else if(id) name = fmEntries[curCont][id].name.replace(/\'/g, "\\'");
				for(i in caption) caption[i] = caption[i].replace(/\'/g, "\\'");
				action = "fmLib.openDialog('" + url + "', '" + json.dialog + "', ['" + caption.join("','") + "'], '" + id + "')";
			}
		}
		return action;
	},

	parseMenu: function(items, curCont, id) {
		var i, css, icon, action;
		var html = '<table border="0" cellspacing="0" cellpadding="0" width="100%">';

		for(i = 0; i < items.length; i++) {
			if(items[i].caption == 'separator') {
				if(items[i+1] && items[i+1].caption != 'separator') {
					if(items[i].title) {
						html += '<tr class="fmMenuBorder"><td class="fmMenuTitle" colspan="2" height="22">' + items[i].title + '</td></tr>';
					} else {
						html += '<tr class="fmMenuBorder" style="border-bottom:none"><td colspan="2" style="height:0"></td></tr>';
					}
				}
			} else {
				css = (items[i].call || items[i].exec || items[i].dialog) ? 'fmMenuItem' : 'fmMenuItemDisabled';
				icon = '<i class="' + items[i].icon + '"></i>';
				action = this.parseAction(items[i], curCont, id);

				html += '<tr class="fmMenuTR" style="cursor:pointer;height:24px" onClick="' + action + '">' +
						'<td class="fmMenuTD" width="24" align="center">' + icon +
						'<td class="' + css + '">' + items[i].caption + '</td></tr>';
			}
		}
		html += '</table>';
		return html;
	},

	_checkAction: function(item, json) {
		var url = '?action&fmContainer=' + json.cont;
		var menu = "fmLib.viewMenu('" + item.id + "', '" + json.cont + "')";
		if(item.deleted) return menu;

		var action = menu;

		if(item.type == 'cdup') {
			var mode = (json.search != '') ? 'search' : 'parent';
			action = "fmLib.call('" + url + '&fmMode=' + mode + "')";
			menu = "fmLib.viewMenu(-1, '" + json.cont + "')";

			if(fmLib.useRightClickMenu[json.cont]) {
				return 'if(event.button == 2) { ' + menu + '; } else { ' + action + '; }';
			}
			return "(event.button == 2) ? '' : fmLib.noMenu = true; " + action + ';';
		}

		if(fmLib.useRightClickMenu[json.cont]) {
			var lang = fmContSettings[json.cont].language;
			var userPerms = fmContSettings[json.cont].userPerms;

			if(item.type == 'dir') {
				action = this.parseAction({call:'open'}, json.cont, item.id);
			}
			else if(fmContSettings[json.cont].customAction && fmContSettings[json.cont].customAction.action) {
				action = this.parseAction({exec:[fmContSettings[json.cont].customAction.action,json.cont,item.id,fmEntries[json.cont][item.id].fullName]});
			}
			else if(userPerms.docViewer && item.docType > 0) {
				switch(item.docType) {

					case 1:	// plain text
						if(item.type == 'code' || item.type == 'text') action = this.parseAction({caption:fmMsg[lang].cmdEdit,dialog:'fmEditor'}, json.cont, item.id);
						else action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmTextViewer'}, json.cont, item.id);
						break;

					case 2:	// Google Docs Viewer or PDF
						if(fmEntries[json.cont][item.id].name.match(/\.pdf$/i)) {
							action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmPdfViewer'}, json.cont, item.id);
						}
						else if(fmContSettings[json.cont].publicUrl != '') {
							action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmDocViewer'}, json.cont, item.id);
						}
						break;
				}
			}
			else if(userPerms.imgViewer && item.name.match(this.imageFiles)) {
				action = this.parseAction({caption:fmMsg[lang].cmdView,dialog:'fmImgViewer'}, json.cont, item.id);
			}
			else if(userPerms.mediaPlayer && (item.name.match(this.audioFiles) || item.name.match(this.videoFiles))) {
				action = this.parseAction({caption:fmMsg[lang].cmdPlay,dialog:'fmMediaPlayer'}, json.cont, item.id);
			}
			return 'if(event.button == 2) { ' + menu + '; } else { ' + action + '; }';
		}
		return "(event.button == 2) ? '' : " + menu;
	},

	_getFileCount: function(cont) {
		if(!fmContSettings[cont].listJson.entries) return 0;
		var items = fmContSettings[cont].listJson.entries.items;
		var cnt = 0;

		if(items) for(var i in items) {
			if(!items[i].isDir && items[i].type != 'cdup' && !items[i].deleted) {
				cnt++;
			}
		}
		return cnt;
	}
}
