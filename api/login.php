<?php
require_once("../include/includes.php");
setContentType("text","plain");
session_start(); 

$postData = $_POST;
if(!$postData)
	$postData = getJsonPostData();

//$postData = array("action" => "login", "username" => "amy", "password" => "koKoBird" );
debugVar("postData");

$action = $postData ? @$postData["action"] : reqParam("action");
debugVar("action");

$response = array();

// POST: {action: login, username:, password: md5}, return user if successful or null if login fail
// POST: {action: register, username, email, password: md5, first_name, last_name}, return user if successful or null if login already exists.
// GET/POST  {}		return current session["user"];
// GET/POST  {action: logout} unset session["user"], return empty or null user object;

// response: {success: true, user: {}, message: }

// set current user in SESSION
switch ($action)
{
	case "logout":
		pdjUserLogout();
		$response["message"] = "User logged out.";
		break;
	default:
		pdjSetUser($postData);
		$response["user"] = pdjCurrentUser();
		break;
}

echo jsValue($response, true, true);
?>