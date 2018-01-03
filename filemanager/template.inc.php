<?php

/**
 * This code is part of the FileManager software (www.gerd-tentler.de/tools/filemanager), copyright by
 * Gerd Tentler. Obtain permission before selling this code or hosting it on a commercial website or
 * redistributing it over the Internet or in any other medium. In all cases copyright must remain intact.
 */

function fmCloseButton($id = '') {
	return '<i class="fmIconClose" id="' . $id . '" onClick="fmLib.fadeOut(fmLib.opacity, fmLib.dialog)"></i>';
}
function fmCloseButton1($id = '') {
	return '<i class="fmIconClose" id="' . $id . '" onClick="fmLib.closeEdit(fmLib.opacity, fmLib.dialog)"></i>';
}

?>
<script type="text/javascript">
var fmWebPath = '<?php print addslashes($fmWebPath); ?>';
var fmContSettings = fmMsg = fmEntries = {};
var fmAudioPlayer = fmVideoPlayer = null;

var xfmLib = {
	initFileManager: function() {
		var body = document.getElementsByTagName('body')[0];
		var msg = '<h3>Invalid web path!</h3>';
		msg += '<p>This is the web path detected by FileManager:</p>';
		msg += '<p style="font-family:Courier New;"><?php echo $fmWebPath; ?></p>';
		msg += '<p>FileManager can not load JavaScript and CSS files from this path. ';
		msg += 'Check the variable <b>fmWebPath</b> in file <b>config.inc.php</b> and enter a valid web path.</p>';
		body.innerHTML = msg;
	}
}
</script>

<div id="fmInfo" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmInfoText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader"></label>
<div id="fmInfoText2" class="InputfieldContent"></div></td>
</tr></table>
</div>

<div id="fmMenu" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmMenuText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody" colspan="2">
<div id="fmMenuText2"></div></td>
</tr></table>
</div>

<div id="fmError" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmErrorText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="width:380px;cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody fmError Inputfield" colspan="2">
<label class="InputfieldHeader"></label>
<div id="fmErrorText2" class="fmError InputfieldContent"></div></td>
</tr></table>
</div>

<div id="fmProgress" class="fmDialog" style="z-index:101" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0"><tr>
<td class="fmDialogBody" style="padding:1px">
<div id="fmProgressText" style="width:215px; padding:4px"></div></td>
</tr></table>
</div>

<div id="fmRename" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmRename" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="rename">
<input type="hidden" name="fmContainer" value="">
<input type="hidden" name="fmObject" value="">
<table class="Inputfields"><tr>
<td id="fmRenameText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmRenameLabel">New name:</label>
<div class="InputfieldContent">
<input type="text" name="fmName" size="40" maxlength="60" required class="fmField InputfieldMaxWidth" value=""><br>
<input type="submit" id="fmRenameButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Rename">
</div></td>
</tr></table>
</form>
</div>

<div id="fmDelete" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmDelete" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="delete">
<input type="hidden" name="fmObject" value="">
<table class="Inputfields"><tr>
<td id="fmDeleteText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmDeleteLabel">Delete?</label>
<div class="InputfieldContent">
<input type="submit" id="fmDeleteButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Delete!">
</div></td>
</tr></table>
</form>
</div>

<div id="fmPerm" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmPerm" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="permissions">
<input type="hidden" name="fmObject" value="">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmPermText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="width:280px;cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmPermLabel"></label>
<div class="InputfieldContent">
<table><tr>
<td>&nbsp;</td>
<td id="fmPermText2"></td>
<td id="fmPermText3"></td>
<td id="fmPermText4"></td>
</tr><tr>
<td id="fmPermText5"></td>
<td><input type="checkbox" name="fmPerms[0]" value="1"></td>
<td><input type="checkbox" name="fmPerms[3]" value="1"></td>
<td><input type="checkbox" name="fmPerms[6]" value="1"></td>
</tr><tr>
<td id="fmPermText6"></td>
<td><input type="checkbox" name="fmPerms[1]" value="1"></td>
<td><input type="checkbox" name="fmPerms[4]" value="1"></td>
<td><input type="checkbox" name="fmPerms[7]" value="1"></td>
</tr><tr>
<td id="fmPermText7"></td>
<td><input type="checkbox" name="fmPerms[2]" value="1"></td>
<td><input type="checkbox" name="fmPerms[5]" value="1"></td>
<td><input type="checkbox" name="fmPerms[8]" value="1"></td>
</tr></table>
<input type="submit" id="fmPermButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Apply">
</div></td>
</tr></table>
</form>
</div>

<div id="fmFileDrop" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" width="250" class="Inputfields"><tr>
<td id="fmFileDropText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label id="fmDeleteText2" class="InputfieldHeader">Drop area</label>
<div class="InputfieldContent">
<fieldset id="fdZone">
<legend id="fmFileDropBoxTitle" class="fmxTD3"></legend>
<p id="fmFileDropBoxContent" class="fmxTD3"></p>
</fieldset>
<div id="fmFileDropProgress" class="fmProgressBarCont" style="display:none"></div>
<form name="fmFileDrop" class="fmForm" method="post">
<input type="hidden" name="fmMode" value="upload">
<div class="fmDialogBody" style="font-weight:normal; text-align:left; border:none">
<input type="checkbox" name="fmReplSpaces" value="1"<?php if($fmReplSpacesUpload) print ' checked="checked" disabled="disabled"'; ?>>
file name <i class="fmIconArrowRight"></i> file_name<br>
<input type="checkbox" name="fmLowerCase" value="1"<?php if($fmLowerCaseUpload) print ' checked="checked" disabled="disabled"'; ?>>
FileName <i class="fmIconArrowRight"></i> filename
</div>
</form>
</div></td>
</tr></table>
</div>

<div id="fmJavaUpload" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmJavaUploadText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<iframe name="JUpload" width="524" height="254" border="0" frameborder="0"></iframe>
<form name="fmJavaUpload" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="upload">
<div class="fmDialogBody" style="font-weight:normal; text-align:left; border:none">
<input type="checkbox" name="fmReplSpaces" value="1"<?php if($fmReplSpacesUpload) print ' checked="checked" disabled="disabled"'; ?>>
file name =&gt; file_name<br>
<input type="checkbox" name="fmLowerCase" value="1"<?php if($fmLowerCaseUpload) print ' checked="checked" disabled="disabled"'; ?>>
FileName =&gt; filename
</div>
</form>
</td>
</tr></table>
</div>

<div id="fmNewFile" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmNewFile" class="fmForm InputfieldForm" method="post" enctype="multipart/form-data">
<input type="hidden" name="fmMode" value="newFile">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmNewFileText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="width:380px;cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmNewFileLabel">Select files:</label>
<div class="InputfieldContent">
<input class="ui-button ui-state-default" type="file" name="fmFile[0]" size="20" class="fmField" onClick="fmLib.newFileSelector(1)" onChange="fmLib.newFileSelector(1)">
<input class="ui-button ui-state-default" type="file" name="fmFile[1]" size="20" class="fmField" onClick="fmLib.newFileSelector(2)" onChange="fmLib.newFileSelector(2)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[2]" size="20" class="fmField" onClick="fmLib.newFileSelector(3)" onChange="fmLib.newFileSelector(3)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[3]" size="20" class="fmField" onClick="fmLib.newFileSelector(4)" onChange="fmLib.newFileSelector(4)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[4]" size="20" class="fmField" onClick="fmLib.newFileSelector(5)" onChange="fmLib.newFileSelector(5)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[5]" size="20" class="fmField" onClick="fmLib.newFileSelector(6)" onChange="fmLib.newFileSelector(6)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[6]" size="20" class="fmField" onClick="fmLib.newFileSelector(7)" onChange="fmLib.newFileSelector(7)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[7]" size="20" class="fmField" onClick="fmLib.newFileSelector(8)" onChange="fmLib.newFileSelector(8)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[8]" size="20" class="fmField" onClick="fmLib.newFileSelector(9)" onChange="fmLib.newFileSelector(9)" style="display:none">
<input class="ui-button ui-state-default" type="file" name="fmFile[9]" size="20" class="fmField" style="display:none">
<div class="fmDialogBody" style="font-weight:normal; text-align:left; border:none">
<input type="checkbox" name="fmReplSpaces" value="1"<?php if($fmReplSpacesUpload) print ' checked="checked" disabled="disabled"'; ?>>
&nbsp;file name <i class="fmIconArrowRight"></i> file_name<br>
<input type="checkbox" name="fmLowerCase" value="1"<?php if($fmLowerCaseUpload) print ' checked="checked" disabled="disabled"'; ?>>
&nbsp;FileName <i class="fmIconArrowRight"></i> filename
</div>
<input type="submit" id="fmNewFileButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Upload">
</div></td>
</tr></table>
</form>
</div>

<div id="fmNewDir" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmNewDir" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="newDir">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmNewDirText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move" nowrap="nowrap"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmNewDirLabel">Directory name:</label>
<div class="InputfieldContent">
<input type="text" name="fmName" size="40" maxlength="60" class="fmField InputfieldMaxWidth"><br>
<input type="submit" id="fmNewDirButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Create">
</div></td>
</tr></table>
</form>
</div>

<div id="fmCreateFile" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmCreateFile" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="createFile">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmCreateFileText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move" nowrap="nowrap"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmCreateFileLabel">File name:</label>
<div class="InputfieldContent">
<input type="text" name="fmName" size="40" maxlength="60" class="fmField InputfieldMaxWidth"><br>
<input type="submit" id="fmCreateFileButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Create">
</div></td>
</tr></table>
</form>
</div>

<div id="fmSearch" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmSearch" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="search">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmSearchText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmSearchLabel"></label>
<div class="InputfieldContent">
<input type="text" name="fmName" size="40" maxlength="60" class="fmField InputfieldMaxWidth"><br>
<input type="submit" id="fmSearchButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Search">
</div></td>
</tr></table>
</form>
</div>

<div id="fmSaveFromUrl" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<form name="fmSaveFromUrl" class="fmForm InputfieldForm" method="post">
<input type="hidden" name="fmMode" value="saveFromUrl">
<input type="hidden" name="fmContainer" value="">
<input type="hidden" name="fmObject" value="">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmSaveFromUrlText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="InputfieldHeader" id="fmSaveFromUrlLabel">Url:</label>
<div class="InputfieldContent">
<input type="text" name="fmName" required size="60" maxlength="255" class="fmField InputfieldMaxWidth" value="">
<div class="fmDialogBody">
<input type="checkbox" name="fmReplSpaces" value="1"<?php if($fmReplSpacesUpload) print ' checked="checked" disabled="disabled"'; ?>>
&nbsp;file name <i class="fmIconArrowRight"></i> file_name<br>
<input type="checkbox" name="fmLowerCase" value="1"<?php if($fmLowerCaseUpload) print ' checked="checked" disabled="disabled"'; ?>>
&nbsp;FileName <i class="fmIconArrowRight"></i> filename
</div>
<input type="submit" id="fmSaveFromUrlButton" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave" value="Save">
</div></td>
</tr></table>
</form>
</div>

<div id="fmExplorer" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" class="Inputfields"><tr>
<td id="fmExplorerText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody Inputfield" colspan="2">
<label class="_disabled_InputfieldHeader"></label>
<div class="_disabled_InputfieldContent">
<div id="fmExplorerText2" style="width:320px;height:400px;overflow:auto"></div>
</div></td>
</div>
</tr></table>
</div>

<div id="fmMediaPlayer" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" width="100%" class="Inputfields"><tr>
<td id="fmMediaPlayerText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:pointer;padding-right:3px"><div id="_disabled_fmMediaPlayerSwitch"></div></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:pointer" align="right"><?php print fmCloseButton('fmCloseBtn'); ?></td>
</tr><tr>
<td id="fmMediaCont" class="fmDialogBody" colspan="3">
<div class="player"></div></td>
</tr></table>
</div>

<div id="fmDocViewer" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" width="100%"><tr>
<td id="fmDocViewerText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" style="cursor:pointer"><?php print fmCloseButton(); ?></td>
</tr><tr>
<td class="fmDialogBody" colspan="2" width="100%">
<div id="fmDocViewerCont" class="fmThumbnail" style="background-color:#FFF" onMouseOver="fmLib.setContMenu(true)"></div></td>
</tr></table>
</div>

<div id="fmEditor" class="fmDialog ui-dialog" onMouseOver="fmLib.setContMenu(false)" onMouseOut="fmLib.setContMenu(true)">
<table border="0" cellspacing="0" cellpadding="0" width="100%" class="Inputfields"><tr>
<td id="fmEditorText" class="fmDialogTitle ui-dialog-titlebar ui-widget-header" style="cursor:move"></td>
<td id="fmEditorButton" class="fmDialogTitle ui-dialog-titlebar ui-widget-header"  align="right" width="1%" style="cursor:pointer"></td>
<td class="fmDialogTitle ui-dialog-titlebar ui-widget-header" align="right" width="1%" style="cursor:pointer"><?php print fmCloseButton1('fmEditorCloseButton'); ?></td>
</tr><tr>
<td class="fmDialogBody" colspan="3" width="100%">
<div id="fmEditorCont" class="fmThumbnail" style="background-color:#FFF" onMouseOver="fmLib.setContMenu(true)"></div></td>
</tr>
<td id="fmEditorSaveButton" class="fmDialogBody Inputfield" colspan="3" width="100%" style="visibility:hidden"> <!--to prevent jumping-->
<label class="InputfieldHeader"></label>
<div class="InputfieldContent">
<button id="fmEditorButton1" class="fmButton ui-widget ui-button ui-state-default aos_hotkeySave"><span class="ui-button-text">&nbsp;</span></button></td><!--to have the height-->
</div></tr></table>
</div>

<div id='fmOverlay' class="ui-widget-overlay ui-front" style="display:none"></div>

<iframe name="fmFileAction" style="display:none"></iframe>
