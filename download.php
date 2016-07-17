<?php

	$dir = $_GET['name'];
	$unlnk = $_GET['u'];
	$file_url = getcwd().$dir;
	$type = mime_content_type($dir);

	header('Content-Description: File Transfer');
	header('Content-Type: '.$type);
	header("Content-Disposition: attachment; filename=\"" . basename($file_url) . "\"");
	header('Content-Transfer-Encoding: Binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	header('Pragma: public');
	header('Content-Length: ' . filesize($file_url));

	ob_clean();
	ob_end_flush();
	$handle = fopen($file_url, "rb");

	if($unlnk === "y") {
		ignore_user_abort(true);
		while (!feof($handle)) {
			echo fread($handle, 1000);
		}
		unlink($file_url);
	} else {
		while (!feof($handle)) {
			echo fread($handle, 1000);
		}
	}

?>

