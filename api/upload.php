<?php
require_once("../include/includes.php");
setContentType("text","plain");
session_start(); 
//receive file and other form fields
//move file to temp location:  $BASE_IMAGE_DIR/$username/$recipeID/$filename
//load, resize, crop image.
//do not keep original file
//insert into upload table.
//What if user/filename already exists? can user reuse existing image, select from uploads?
//response: image metadata from EXIF and url.

$username = pdjCurrentUsername();
$recipeId = postParam("recipeid");
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
if($nbFiles && $username)
{
	$subdir = combine($username, $recipeid)
	$file = reset($_FILES);
	$response = processUpload($file, $subdir);
	//$exif = $response["_exif"];
}

$response["post"] = $_POST;
addVarsToArray($response, "success message nbFiles recipeid subdir");
$response["time"] = getTimer(true);
echo jsValue($response, true, true);
?>