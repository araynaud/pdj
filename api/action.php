<?php
header("Content-Type: text/plain");
require_once("../include/includes.php");
session_start(); 

// 1 check if current user is owner of this recipe / dir
$path = reqPath();
$relPath = getDiskPath($path);
$pdjUser = pdjCurrentUser();
$username = pdjCurrentUsername();

$patharr = explode("/", $path);
$recipeId = array_pop($patharr);
$recipeUserId = array_pop($patharr);

$file = reqParam("file");
$action = reqParam("action");
$newName = reqParam("to");
$result=false;
$message="";
debugVar("filePath");

debugVar("tnsizes");

//1 check file exists
if(!isOwner($path))
	$message ="User does not have access to $recipeId.";
//2 check file exists
else if(empty($file))
	$message ="No file selected.";
else if(!file_exists("$relPath/$file"))
	$message = "File $path/$file does not exist.";
else if($action == "delete")
{
	$result = deleteImage($relPath, $file);
}
else if($action == "rename")
{
	$result = renameImage($relPath, $file, $newName);
}
else if($action == "main")
{
	$newName = $recipeId;
	$result = setImageAsMain($relPath, $file, $newName);
}

if(!$result) $newName="";

$response = array();
addVarsToArray($response, "recipeId recipeUserId message result relPath newName");
$response["time"] = getTimer(true);
echo jsValue($response, true, true);
?>
