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
$userId = pdjCurrentUserId();
$recipeId = reqParam("recipeid");
debug("Request", $_REQUEST);
debug("GET request", $_GET);
debug("POST request", $_POST);
debug("POST files", $_FILES, true);
debugVar("subdir",true);

$nbFiles = count($_FILES);

if(!$username)	return errorMessage("No User logged in.");		
if(!$nbFiles)	return errorMessage("No file uploaded.");		
if(!$recipeId)	return errorMessage("No recipe specified.");		

$response = array();
$success = true;
$file = reset($_FILES);
$subdir = combine($userId, $recipeId);
if($file && $recipeId)
	$response = processUpload($file, $subdir);

$response["post"] = $_POST;
addVarsToArray($response, "success username message nbFiles recipeId subdir");
$response["time"] = getTimer(true);
echo jsValue($response, true, true);
?>