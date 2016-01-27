<?php
require_once("../include/includes.php");
setContentType("text","plain");
session_start(); 
//receive file and other form fields
//move file to temp location:  $BASE_IMAGE_DIR/$username/$filename
//load, resize, crop image.
//do not keep original file
//insert into upload table.
//What if user/filename already exists? can user reuse existing image, select from uploads?
//response: image metadata from EXIF and url.

$username = pdjCurrentUsername();
$upload_id = postParam("upload_id");
debugVar("username",true);
debug("Request", $_REQUEST);
debug("GET request", $_GET);
debug("POST request", $_POST);
debug("POST files", $_FILES, true);

if(empty($_FILES) && !$upload_id)
	return errorMessage("No File uploaded.");		

$response = $result = array();
$db = NULL;
$success = true;
$nbFiles = count($_FILES);
if($nbFiles)
	foreach ($_FILES as $file)
		$result[] = processUpload($file);
if($nbFiles == 1)
{
	$response = reset($result);
	$success = $response["success"];
	$exif = $response["_exif"];
}

if($success)
{
	if(!$upload_id) //step 1
		$upload_id = saveUploadData($db, $exif);
	else //step 2
	{
		$success = saveUploadData($db, $_POST);
		$message =  "Details saved.";
	}

	if($upload_id==-1)
		$message =  "DB offline.";
}

$response["post"] = $_POST;
addVarsToArray($response, "success message nbFiles upload_id dateTaken description");
$response["time"] = getTimer(true);
echo jsValue($response, true, true);
?>