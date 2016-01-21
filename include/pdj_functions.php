<?php

function pdjCurrentUser()
{
    return arrayGet($_SESSION, "pdj_user");
}

function pdjCurrentUsername()
{
    return arrayGet($_SESSION, "pdj_user.username");
}

function pdjSetUser($user)
{
   return $_SESSION["pdj_user"] = $user;
}

function pdjUserLogout()
{
    unset($_SESSION["pdj_user"]);
}

function readJsonFile($filename)
{
    $postdata = file_get_contents($filename);
    if($postdata)
        $postdata = json_decode($postdata, true);
    return $postdata;
}

function getJsonPostData()
{
    return readJsonFile("php://input");

    $postdata = file_get_contents("php://input");
    if($postdata)
        $postdata = json_decode($postdata, true);
    return $postdata;
}

function errorMessage($msg)
{
    global $response;
    $response["post"] = $_POST;
    $response["message"] = $msg;
    $response["time"] = getTimer(true);
    die(jsValue($response, true));
}

?>