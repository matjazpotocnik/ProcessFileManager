<?php

/**
 * This code is part of the FileManager software (www.gerd-tentler.de/tools/filemanager), copyright by
 * Gerd Tentler. Obtain permission before selling this code or hosting it on a commercial website or
 * redistributing it over the Internet or in any other medium. In all cases copyright must remain intact.
 */

/**
 * This class provides static methods for general use.
 *
 * @package FileManager
 * @subpackage class
 * @author Gerd Tentler
 */
abstract class FM_Tools {

/* PUBLIC STATIC METHODS *********************************************************************** */

	/**
	 * clean local directory
	 *
	 * @param string $dir			directory
	 * @param integer $time			optional: modification timestamp
	 * @param boolean $remDirs		optional: remove sub folders
	 */
	public static function cleanDir($dir, $time = null, $remDirs = false) {
		if($dp = @opendir($dir)) {
			while(($file = @readdir($dp)) !== false) {
				if($file != '.' && $file != '..') {
					if($time) {
						$atime = @fileatime("$dir/$file");
						$mtime = @filemtime("$dir/$file");
						$fileTime = ($atime > $mtime) ? $atime : $mtime;
						$delete = ($fileTime < $time);
					}
					else $delete = true;

					if($delete) {
						if($remDirs && is_dir("$dir/$file")) self::removeDir("$dir/$file");
						if(is_file("$dir/$file")) @unlink("$dir/$file");
					}
				}
			}
			@closedir($dp);
		}
	}

	/**
	 * remove local directory tree
	 *
	 * @param string $dir	directory
	 */
	public static function removeDir($dir) {
		if($dp = @opendir($dir)) {
			while(($file = @readdir($dp)) !== false) {
				if($file != '.' && $file != '..') {
					if(is_dir("$dir/$file")) self::removeDir("$dir/$file");
					else @unlink("$dir/$file");
				}
			}
			@closedir($dp);
			@rmdir($dir);
		}
	}

	/**
	 * create local directory path
	 *
	 * @param string $newDir
	 * @return boolean
	 */
	public static function makeDir($dir) {
		if(!is_dir(self::dirname($dir))) self::makeDir(self::dirname($dir));
		return (is_dir($dir) || @mkdir($dir, 0755));
	}

	/**
	 * get number of files in local directory
	 *
	 * @param string $dir	directory
	 * @return integer
	 */
	public static function getFileCount($dir) {
		$cnt = 0;
		if($dp = @opendir($dir)) {
			while(($file = @readdir($dp)) !== false) {
				if($file != '.' && $file != '..') {
					if(is_file("$dir/$file")) $cnt++;
				}
			}
			@closedir($dp);
		}
		return $cnt;
	}

	/**
	 * read local file
	 *
	 * @param string $file		file path
	 * @return string $data		file data
	 */
	public static function readLocalFile($file) {
		return @file_get_contents($file);
	}

	/**
	 * save local file
	 *
	 * @param string $path		file path
	 * @param string $data		file data
	 * @param boolean $append	optional: append data to existing file
	 * @return boolean
	 */
	public static function saveLocalFile($path, $data, $append = false) {
		if($append) {
			return @file_put_contents($path, $data, FILE_APPEND);
		}
		return @file_put_contents($path, $data);
	}

	/**
	 * remove local files
	 *
	 * @param string $dir		directory path
	 * @param string $regExp	regular expression for filename
	 */
	public static function removeFiles($dir, $regExp) {
		if($dp = @opendir($dir)) {
			while(($file = @readdir($dp)) !== false) {
				if($file != '.' && $file != '..') {
					if(preg_match($regExp, $file)) {
						@unlink("$dir/$file");
					}
				}
			}
			@closedir($dp);
		}
	}

	/**
	 * get permissions of local file / directory
	 *
	 * @param string $path
	 * @return string
	 */
	public static function getPermissions($path) {
		if(is_dir($path)) {
			$perms = 'd';
			$rwx = substr(decoct(@fileperms($path)), 2);
		}
		else {
			$perms = '-';
			$rwx = substr(decoct(@fileperms($path)), 3);
		}
		for($i = 0; $i < strlen($rwx); $i++) {
			switch($rwx[$i]) {
				case 1: $perms .= '--x'; break;
				case 2: $perms .= '-w-'; break;
				case 3: $perms .= '-wx'; break;
				case 4: $perms .= 'r--'; break;
				case 5: $perms .= 'r-x'; break;
				case 6: $perms .= 'rw-'; break;
				case 7: $perms .= 'rwx'; break;
				default: $perms .= '---';
			}
		}
		return $perms;
	}

	//MP not used
	public static	function is__executable($file) {
		$e = @is_executable($file);
		$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
		if($e || $ext == 'msi' || $ext == 'bat' || $ext == 'com') return true;
		return false;
	}

	//MP not used
	public static function is__writable($path, $dir = null, $mtime = null) {
		if(@is_dir($path)) {
			$pathOld = realpath($path);
			$path = $pathOld . DIRECTORY_SEPARATOR . uniqid(mt_rand()) . '.tmp';
			return self::is__writable($path, $pathOld, @filemtime($pathOld));
		}
		$rm = @file_exists($path);
		$f = @fopen($path, 'a'); //this changes the modification date!
		if($f === false) return false;
		@fclose($f);
		if(!$rm) {
			@unlink($path);
			if($dir != null && $mtime != null) @touch($dir, $mtime); //return modification time to original
		}
		return true;
	}

	/**
	 * Get file permissions on windows.
	 *
	 * @param string $file full file/directory path
	 * @param bool $isDir if path is directory or not, for performance reasons
	 * @return string
	 */
	public static function getPermissionsWin($file, $isDir) {
		/*
										Meaning for Folders																		Meaning for Files
		Read						Permits viewing and listing of files and subfolders		Permits viewing or accessing of the file's contents
		Write						Permits adding of files and subfolders								Permits writing to a file
		Read & Execute	Permits viewing and listing of files and subfolders		Permits viewing and accessing of the file's contents
										as well as executing of files; inherited by files			as well as executing of the file
										and folders
		*/

		if($isDir) {
			$isReadable = is_readable($file);
			//$isReadable = (@opendir($file) === false) ? false : true; // opendir is not much faster
			$isWritable = is_writable($file);
			//$isExecutable = is_executable($file); // always false
			$isExecutable = $isReadable; // let assume read is equal execute
		} else {
			//$isReadable = (@fopen($file, 'r') === false) ? false : true;
			// if file is not readble, you get an error in php log file, also it's not much faster
			$isReadable = is_readable($file);
			$isWritable = is_writable($file);
			$isExecutable = $isReadable ? is_executable($file) : false;
		}

		$perms = '---';
		if($isReadable)   $perms[0] = 'R';
		if($isWritable)   $perms[1] = 'W';
		if($isExecutable) $perms[2] = 'X';

		return $perms;
	}

	/**
	 * Get acl data, owner and permissions on windows. Uses fileacl.exe executable
	 *
	 * @param string $file full file/directory path
	 * @return string
	 */
	public static function getAcl($file) {

		$owner = $acl = 'unknown';
		$command = '"' . __DIR__ . '\fileacl.exe" "' . realpath($file) . '" /simple /owner';

		exec($command, $output, $result);

		if($result == 127) {
			return '"error":"command not found"';
		} else if($result != 0) {
			return '"error":"command failed: ' . $result . '"';
		} else {
			if(count($output) > 0) {
				$acl = '';
				foreach($output as $line) {
					//$file;domain\username:RWXD
					$line = explode(';', $line)[1];
					$line = str_replace("\\", "\\\\", $line);
					if(strpos($line, 'OWNER=') !== false) {
						$owner = explode('=', $line)[1];
					} else {
						$acl .= $line . '<br>';
					}
				}
				$acl = substr($acl, 0, -4); // remove last <br>
			}
		}

		$perms = self::getPermissionsWin($file, is_dir($file));

		return "owner:\"" . $owner . "\", acl:\"" . $acl . "\", perms:\"" . $perms . "\"";
	}

	/**
	 * call URL
	 *
	 * @param string $url				URL
	 * @param string $errstr			stores error message
	 * @return string					response
	 */
	public static function callUrl($url, &$errstr) {
		$errno = $errstr = $response = '';
		$urlParts = parse_url($url);
		if(isset($urlParts['host']) && $urlParts['host'] != '') $host = $urlParts['host'];
		else if(isset($_SERVER['HTTP_HOST'])) $host = $_SERVER['HTTP_HOST'];
		if($host == '' || $host == 'localhost') $host = '127.0.0.1';
		$port = (isset($urlParts['port']) && $urlParts['port'] > 0) ? $urlParts['port'] : 80;
		$query = (isset($urlParts['query']) && $urlParts['query'] != '') ? '?' . $urlParts['query'] : '';
		$path = isset($urlParts['path']) ? $urlParts['path'] . $query : $query;
		$path = str_replace(' ', '%20', $path);

		if($sp = @fsockopen($host, $port, $errno, $errstr, 10)) {
			$out = "GET $path HTTP/1.0\r\n";
			$out .= "Host: $host\r\n";

			if(isset($urlParts['user']) && isset($urlParts['pass'])) {
				$login = base64_encode($urlParts['user'] . ':' . $urlParts['pass']);
				$out .= "Authorization: Basic $login\r\n";
			}
			$out .= "Connection: close\r\n\r\n";
			@fwrite($sp, $out);

			while(!@feof($sp)) {
				$response .= @fread($sp, 4096);

				if(preg_match('/^HTTP\/[\d\.]+ (\d+) ([\w ]+)/i', $response, $m)) {
					if($m[1] != 200) {
						$errstr = "Host returned \"$m[1] $m[2]\"";
						break;
					}
				}
			}
			@fclose($sp);
		}
		return $response;
	}

	/**
	 * check if string contains 3 or 4 byte characters (Chinese etc.);
	 * usually these characters have a bigger width than the characters
	 * of the Latin alphabet
	 *
	 * @param string $str		the string
	 * @return boolean
	 */
	public static function containsBigChars($str) {
		return preg_match('/[\xE0-\xF4][\x80-\xBF]{2,3}/', $str);
	}

	/**
	 * check if string contains UTF-8 characters
	 *
	 * @param string $str	the string
	 * @return boolean
	 */
	public static function isUtf8($str) {
		if(!is_string($str)) return false;
		return preg_match('%(?:
			[\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
			|\xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
			|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2} # straight 3-byte
			|\xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
			|\xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
			|[\xF1-\xF3][\x80-\xBF]{3}         # planes 4-15
			|\xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
			)%x', $str);
	}

	/**
	 * encode string if it doesn't contain UTF-8 characters
	 *
	 * @param string $str		the string
	 * @param string $encoding	character set
	 * @return string			encoded string
	 */
	public static function utf8Encode($str, $encoding) {
		if($encoding != '' && $encoding != 'UTF-8') {
			if(!self::isUtf8($str)) {
				if(function_exists('iconv')) {
					return iconv($encoding, 'UTF-8//TRANSLIT', $str);
				}
				else if(function_exists('mb_convert_encoding')) {
					return mb_convert_encoding($str, 'UTF-8', $encoding);
				}
				//else if (function_exists('utf8_encode')) {
				//	return utf8_encode($str);
				//}
				else return $str;
			}
		}
		return $str;
	}

	/**
	 * decode string if it contains UTF-8 characters
	 *
	 * @param string $str		the string
	 * @param string $encoding	character set
	 * @return string			decoded string
	 */
	public static function utf8Decode($str, $encoding) {
		if($encoding != '' && $encoding != 'UTF-8') {
			if(self::isUtf8($str)) {
				if(function_exists('iconv')) {
					return iconv('UTF-8', $encoding . '//TRANSLIT', $str);
				}
				else if(function_exists('mb_convert_encoding')) {
					return mb_convert_encoding($str, $encoding, 'UTF-8');
				}
				//else if(function_exists('utf8_decode')) {
				//	return utf8_decode($str);
				//}
				else return $str;
			}
		}
		return $str;
	}

	/**
	 * try to detect the encoding of a string
	 *
	 * @param string $str
	 * @return string
	 */
	public static function getEncoding($str) {
		$encodings = array(
			'UTF-8', 'ASCII',
			'ISO-8859-1', 'ISO-8859-2', 'ISO-8859-3', 'ISO-8859-4', 'ISO-8859-5',
			'ISO-8859-6', 'ISO-8859-7', 'ISO-8859-8', 'ISO-8859-9', 'ISO-8859-10',
			'ISO-8859-13', 'ISO-8859-14', 'ISO-8859-15', 'ISO-8859-16',
			'Windows-1251', 'Windows-1252', 'Windows-1254',
			'EUC-JP', 'SJIS', 'eucJP-win', 'SJIS-win', 'JIS', 'ISO-2022-JP'
		);

		if(function_exists('mb_detect_encoding')) {
			return mb_detect_encoding($str, $encodings, true);
		}
		else if(function_exists('iconv')) {
			foreach($encodings as $item) {
				$sample = iconv($item, $item, $str);
				if (md5($sample) == md5($str)) {
					return $item;
				}
			}
		}
		return '';
	}

	/**
	 * strlen() that works also with UTF-8 strings
	 *
	 * @param string $str			the string
	 * @return integer				number of characters
	 */
	public static function strlen($str) {
		$str = (string) $str;
		if(self::isUtf8($str)) {
			if(function_exists('mb_strlen')) {
				return mb_strlen($str, 'UTF-8');
			}
			return preg_match_all('/.{1}/us', $str, $m);
		}
		return strlen($str);
	}

	/**
	 * strtolower() that works also with UTF-8 strings
	 *
	 * @param string $str			the string
	 * @return string				lowercase string
	 */
	public static function strtolower($str) {
		$str = (string) $str;
		if(self::isUtf8($str)) {
			if(function_exists('mb_strtolower')) {
				return mb_strtolower($str, 'UTF-8');
			}
		}
		return strtolower($str);
	}

	/**
	 * substr() that works also with UTF-8 strings
	 *
	 * @param string $str				the string
	 * @param integer $start		start position
	 * @param integer $length		optional: number of characters
	 * @return string						the substring
	 */
	public static function substr($str, $start, $length = null) {
		$str = (string) $str;
		if(self::isUtf8($str)) {
			if(function_exists('mb_substr')) {
				return mb_substr($str, $start, $length, 'UTF-8');
			}
			if(!$length) $length = self::strlen($str);
			preg_match('/.{' . $start . '}(.{' . ($length - $start) . '})/us', $str, $m);
			return $m[1];
		}
		return substr($str, $start, $length);
	}

	/**
	 * basename() that works also with UTF-8 strings
	 *
	 * @param string $path		file path
	 * @return string
	 */
	public static function basename($path) {
		if(self::isUtf8($path)) {
			$name = self::getSuffix($path, '/');
			return ($name != '') ? $name : $path;
		}
		return basename($path);
	}

	/**
	 * dirname() that works also with UTF-8 strings
	 *
	 * @param string $path		file path
	 * @return string
	 */
	public static function dirname($path) {
		if(self::isUtf8($path)) {
			$parts = explode('/', $path);
			array_pop($parts);
			return implode('/', $parts);
		}
		return dirname($path);
	}

	/**
	 * get suffix/extension from a string
	 *
	 * @param string $str
	 * @param string $delimiter
	 * @return string
	 */
	public static function getSuffix($str, $delimiter) {
		if(false === strpos($str, $delimiter)) return '';
		$tmp = explode($delimiter, $str);
		return end($tmp);
	}

	/**
	 * get prefix from a string
	 *
	 * @param string $str
	 * @param string $delimiter
	 * @return string
	 */
	public static function getPrefix($str, $delimiter) {
		if(false === strpos($str, $delimiter)) return '';
		$tmp = explode($delimiter, $str);
		return reset($tmp);
	}

	/**
	 * convert strings like "8M" or "50K" to bytes; needs bcMath library
	 * to work with gigabytes or higher values
	 *
	 * @param string $str
	 * @return integer
	 */
	public static function string2bytes($str) {
		$hasBc = function_exists('bcmul');
		preg_match('/\d+(\.\d+)?/', $str, $m);
		$bytes = $m[0];
		switch(strtoupper($str[strlen($str) - 1])) {
			case 'K': return round($bytes * 1024);
			case 'M': return round($bytes * 1024 * 1024);
			case 'G': return $hasBc ? bcmul($bytes, 1024 * 1024 * 1024) : round($bytes);
			case 'T': return $hasBc ? bcmul($bytes, 1024 * 1024 * 1024 * 1024) : round($bytes);
		}
		return round($bytes);
	}

	/**
	 * convert bytes to strings like "8.5 M" or "50 K"; needs bcMath library
	 * to work with gigabytes or higher values
	 *
	 * @param integer $bytes	number of bytes
	 * @param integer $dec		optional: decimals
	 * @return string
	 */
	public static function bytes2string($bytes, $dec = 1) {
		if(!function_exists('bcmul')) {
			$sizes = array(
				'M' => 1024 * 1024,
				'K' => 1024
			);
			foreach($sizes as $key => $val) {
				if($bytes >= $val) {
					return round($bytes / $val, $dec) . ' ' . $key;
				}
			}
			return round($bytes) . ' B';
		}
		$sizes = array(
			'T' => bcmul(1024, 1024 * 1024 * 1024),
			'G' => bcmul(1024, 1024 * 1024),
			'M' => 1024 * 1024,
			'K' => 1024
		);
		foreach($sizes as $key => $val) {
			if($bytes >= $val) {
				return round(bcdiv($bytes, $val, $dec ? $dec : 1), $dec) . ' ' . $key;
			}
		}
		return round($bytes) . ' B';
	}

	/**
	 * get web path
	 *
	 * @return string
	 */
	public static function getWebPath() {
		$incPath = str_replace('\\', '/', realpath(dirname(__FILE__) . '/..'));
		$webPath = preg_replace('%^' . preg_quote($_SERVER['DOCUMENT_ROOT'], '%') . '%', '', $incPath);

		if($webPath == $incPath) {
			$ld = basename($_SERVER['DOCUMENT_ROOT']);
			$webPath = substr($incPath, strpos($incPath, $ld) + strlen($ld));
		}
		return $webPath;
	}

	/**
	 * get message string
	 *
	 * @param string $token		message token
	 * @param string $val		optional: additional value
	 * @return string
	 */
	public static function getMsg($token, $val = '') {
		global $msg, $fmEncoding, $fmCnt;
		return $msg[$token] . (($val != '') ? ': ' . self::utf8Encode($val, $fmEncoding[$fmCnt]) : '');
	}

	/**
	 * get memory usage
	 *
	 * @return integer
	 */
	public static function getMemoryUsage() {
		if(function_exists('memory_get_usage')) {
			return function_exists('memory_get_peak_usage')
				? memory_get_peak_usage(true)
				: memory_get_usage();
		}
		return 0;
	}

	/**
	 * read synchsafe number
	 *
	 * @param integer $in
	 * @return integer
	 */
	public static function unsynchsafe($in) {
		$out = 0;
		$mask = 0x7F000000;

		for($i = 0; $i < 4; $i++) {
			$out >>= 1;
			$out |= $in & $mask;
			$mask >>= 8;
		}
		return $out;
	}

	/**
	 * Try to detect line endings based on presence of \r\n cahracters.
	 *
	 * @param string $content
	 * @return string "win", "nix", "mac" or ""
	 *
	 */
	public static function detect_newline_type($content) {
		//https://stackoverflow.com/questions/11066857/detect-eol-type-using-php
		$arr = array_count_values(
							explode(
								' ',
								preg_replace(
									'/[^\r\n]*(\r\n|\n|\r)/',
									'\1 ',
									$content
								)
							)
					);
		arsort($arr);
		$k = key($arr);
		if($k == "\r\n") return "win";
		if($k == "\n") return "nix";
		if($k == "\r") return "mac";
		return "";
	}

	/**
	 * Handles changing line endings to the required style.
	 *
	 * @param string $content file content
	 * @param string $lineEnding original file's line ending
	 * @return string
	 *
	 */
	public static function handleLineEndings($content, $lineEnding = '') {
		$target_ending = 'auto'; //default

		if($target_ending == 'none') return $content;
		if($target_ending == 'auto') $target_ending = $lineEnding;

		//$currentLineEnding = self::detect_newline_type($content);
		$currentLineEnding = 'nix'; //input is always in unix
		if($currentLineEnding == 'win') {
			if($target_ending == 'mac') return str_replace("\n", '',     $content);
			if($target_ending == 'nix') return str_replace("\r", '',     $content);
		} else if($currentLineEnding == 'mac') {
			if($target_ending == 'win') return str_replace("\r", "\r\n", $content);
			if($target_ending == 'nix') return str_replace("\r", "\n",   $content);
		} else if($currentLineEnding == 'nix') {
			if($target_ending == 'win') return str_replace("\n", "\r\n", $content);
			if($target_ending == 'mac') return str_replace("\n", "\r",   $content);
		}

		return $content;
	}
}

?>