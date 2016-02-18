<?php
require_once("../include/includes.php");
setContentType("text","plain");
session_start(); 

function parseElement($html, $tag)
{
	$title = substringAfter($html, "<$tag");
	return $title = substringBetween($title, ">", "</$tag>");
}

function afterElement(&$html, $tag)
{
	return $html = substringAfter($html, "</$tag>");
}

function parseSelfCloseElement($html, $tag)
{
	return substringBetween($html, "<$tag ", ">");
}

function afterSelfCloseElement(&$html, $tag)
{
	return $html = substringAfter($html, ">");
}

function hasAttribute($html, $name)
{
	return contains($html, "$name=");
}

function parseAttribute($html, $name)
{
	$sep = substringAfter($html, "$name=");
	$sep = substr($sep, 0, 1);  // " or '
	return substringBetween($html, "$name=$sep", $sep);
}

function parseFirstAttribute($html, &$name)
{
	$name = substringBefore($html, "=");
	$sep = substringAfter($html, "$name=");
	$sep = substr($sep, 0, 1);  // " or '
	return substringBetween($html, "=$sep", $sep);
}

function afterAttribute(&$html)
{
	$sep = substringAfter($html, "$name=");
	$sep = substr($sep, 0, 1);  // " or '

	$html = substringAfter($html, $sep);
	return $html = substringAfter($html, $sep);
}

function parseMeta($html)
{
	$metas = array();
	while($html)
	{
		$meta = parseSelfCloseElement($html, "meta");
		if(!$meta) $meta = parseSelfCloseElement($html, "META");
		if(!$meta) break;

		$firstVal = parseFirstAttribute($meta, $firstName);

debug("meta", $meta);
		$name = parseAttribute($meta, "name");
		if(!$name)	$name = parseAttribute($meta, "property");
		if(!$name)	$name = parseAttribute($meta, "itemprop");
		if(!$name)	$name = parseAttribute($meta, "http-equiv");
		if(!$name)  $name = $firstName;
debug("name", $name);
		
		if(hasAttribute($meta, "content")) 
			$content = parseAttribute($meta, "content");
		else 
			$content = $firstVal;
debug("content", $content);

		if($name && $content)
			$metas[$name] = $content;
		else
			$metas[$firstName] = $firstVal;
		afterSelfCloseElement($html, "meta");
	}
	return $metas;
}

//get link 
$url = @$_SERVER['PATH_INFO'];
$url = substr($url, 1);

	$protocol = substringBefore($url, "/");
	$protocol = substringBefore($protocol, ":");
	if($protocol=="http" || $protocol=="https")
		$url = substringAfter($url, "/");
	else
		$protocol= "http";

	$url = "$protocol://$url";

if($_SERVER['QUERY_STRING'])
	$url .= "?" . @$_SERVER['QUERY_STRING'];
	
debugVar("url");
//$html = file_get_contents($url);
$html = curlGet($url);

//parse contents
$size = strlen($html);
$head  = parseElement($html, "head");
if(!$head) $head  = parseElement($html, "HEAD");
$title = parseElement($head, "title");
if(!$title)  $title = parseElement($head, "TITLE");
$meta = parseMeta($head);

//$response["post"] = $_POST;
addVarsToArray($response, "url title size meta");
$response["time"] = getTimer(true);
echo jsValue($response, true, true);

//echo $html;
debugVar("head");
?>