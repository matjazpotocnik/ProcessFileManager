/*jslint this:true*/
/*jslint browser:true*/
/*jslint white:true*/
/*global
 $, window, parent, fmLib, fmTools, fmUrl, fmMode
 */
$(document).ready(function () {
	"use strict";

	fmLib.initFileManager(fmUrl, fmMode);

	fmTools.addListener(document, "mousemove", function(e) {
		var mouseX = fmLib.mouseX;
		var mouseY = fmLib.mouseY;

		if(e && e.pageX !== null) {
			fmLib.mouseX = e.pageX;
			fmLib.mouseY = e.pageY;
		}
		else if(event && event.clientX !== null) {
			fmLib.mouseX = event.clientX + fmTools.getScrollLeft();
			fmLib.mouseY = event.clientY + fmTools.getScrollTop();
		}
		if(fmLib.mouseX < 0) {
			fmLib.mouseX = 0;
		}
		if(fmLib.mouseY < 0) {
			fmLib.mouseY = 0;
		}

		if(fmLib.dragging && fmLib.dialog) {
			var x = parseInt(fmLib.dialog.style.left + 0);
			var y = parseInt(fmLib.dialog.style.top + 0);
			fmLib.dialog.style.left = x + (fmLib.mouseX - mouseX) + "px";
			fmLib.dialog.style.top = y + (fmLib.mouseY - mouseY) + "px";
		}
	});

	fmTools.addListener(document, "mousedown", function(e) {
		var firedobj = (e && e.target) ? e.target : event.srcElement;
		if(firedobj.nodeType === 3) {
			firedobj = firedobj.parentNode;
		}

		if(firedobj.className) {
			var isTitle = (firedobj.className.indexOf("fmDialogTitle") !== -1);
			var isDialog = (firedobj.className.indexOf("fmDialog") !== -1 && !isTitle);

			if(isTitle) {
				fmTools.setUnselectable(firedobj, "move");

				while(firedobj.tagName !== "HTML" && !isDialog) {
					firedobj = firedobj.parentNode;
					isTitle = (firedobj.className.indexOf("fmDialogTitle") !== -1);
					isDialog = (firedobj.className.indexOf("fmDialog") !== -1 && !isTitle);
				}

				if(firedobj.className.indexOf("fmDialog") !== -1) {
					fmLib.dialog = firedobj;
					fmLib.dragging = true;
					fmLib.setOpacity(50, fmLib.dialog);
				}
			}
		}
	});

	fmTools.addListener(document, "mouseup", function() {
		fmLib.dragging = false;
		fmLib.setOpacity(100, fmLib.dialog);
	});

	fmTools.addListener(document, "keydown", function(e) {
		function cls(obj) {
			if(!obj || !obj.style.visibility === "visible" || !obj.style.display === "block") {
				return;
			}
			if(obj.id === "fmEditor") {
				fmLib.closeEdit(fmLib.opacity, fmLib.dialog);
			} else {
				fmLib.fadeOut(fmLib.opacity, fmLib.dialog);
			}
		}

		e = e || window.event;
		var isEscape = false;
		if(e.key !== "undefined") {
			isEscape = (e.key === "Escape" || e.key === "Esc");
		} else {
			isEscape = (e.keyCode === 27);
		}
		if(isEscape) {
			cls(fmLib.dialog);
		}
	});

});
