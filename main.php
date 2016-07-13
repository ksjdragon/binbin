<?php

if(isset($_POST['getdir']) && !empty($_POST['getdir'])) {
	$dir = $_POST['getdir'];
	echo json_encode((listDir($dir[0],$dir[1])));
}

if(isset($_POST['rootdir']) && !empty($_POST['rootdir'])) {
	echo json_encode('/Database'.'/');
}

if(isset($_POST['zip']) && !empty($_POST['zip'])) {
	$info = $_POST['zip'];
	zip($info[0],$info[1]);
}

function listDir($relroot,$section) {
	$folder = getcwd().$relroot;
	$paths = scandir($folder);
	$ext = array("ext");
	$mod = array("mod");
	$size = array("size");

	$paths = array_slice($paths,$section*100,100);

	foreach ($paths as $dir) {
		$realdir = $folder.'/'.$dir;
	  	if(is_dir($realdir)) {
	  		$ext[] = 'true';
	  		$size[] = "- - - -";
	  	} else {
	  		$ext[] = 'false';
	  		$size[] = human_filesize(filesize($realdir));
	  	}
	  	$mod[] = date ("F d, Y | H:i:s", filemtime($realdir));
	}

	$results[] = $paths;
	$results[] = $ext;
	$results[] = $mod;
	$results[] = $size;

	return $results;
}

function human_filesize($bytes, $decimals = 2) {
  $sz = 'BKMGTP';
  $factor = floor((strlen($bytes) - 1) / 3);
  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor].'B';
}

function zip($path,$title) {
	$root = getcwd();
	// Get real path for our folder
	$rootPath = $root.$path;

	// Initialize archive object

	$zip = new ZipArchive();

	$ziploc = $root.'/zip'.'/'.$title;
	$zip->open($ziploc, ZipArchive::CREATE | ZipArchive::OVERWRITE);
	
	// Create recursive directory iterator
	/* @var SplFileInfo[] $files */
	$files = new RecursiveIteratorIterator(
	    new RecursiveDirectoryIterator($rootPath),
	    RecursiveIteratorIterator::LEAVES_ONLY
	);

	foreach ($files as $name => $file)
	{
	    // Skip directories (they would be added automatically)
	    if (!$file->isDir())
	    {
	        // Get real and relative path for current file
	        $filePath = $file->getRealPath();
	        $relativePath = substr($filePath, strlen($rootPath) + 1);

	        // Add current file to archive
	        $zip->addFile($filePath, $relativePath);
	    }
	}

	// Zip archive will be created only after closing object
	$zip->close();

	return '/zip'.'/'.$title;
} 

?>

