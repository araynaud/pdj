<!doctype html>
<html ng-app="pdjApp">
<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('display_errors', '1');

$MT_DIR = "../mt";
if(!file_exists("$MT_DIR/include/http_functions.php"))
	$MT_DIR = "../MediaThingy";

require_once("$MT_DIR/include/http_functions.php");
require_once("$MT_DIR/include/text_functions.php");
require_once("$MT_DIR/include/debug_functions.php");
require_once("$MT_DIR/include/path_functions.php");
require_once("$MT_DIR/include/dir_functions.php");
require_once("$MT_DIR/include/file_functions.php");
require_once("$MT_DIR/include/ui_functions.php");
require_once("$MT_DIR/include/json_xml_functions.php");

function getRecipeUrl($id)
{
	if(!$id) return;

	if(getConfig("offline"))
	{
		$url = getConfig("pdjApi.offline.recipeDetails");
		return toAbsoluteUrl($url);
	}

	$pdjApiRoot = getConfig("pdjApi.root");
	$proxy = getConfig("pdjApi.proxy");
	$url = getConfig("pdjApi.recipeDetails") . $id;
	$url = $pdjApiRoot . "/" . $url;
//	if($proxy)	$url = combine($proxy, $url);
	return toAbsoluteUrl($url);
}

//get recipe id and parameters from query string, 
$config = readConfigFile("pdj.config");
debugText("<div id='php_debug' class='footerRightCorner left text controls photoBorder bgwhite'>DEBUG");
$offline = getConfig("offline");
$recipeid = reqParam("recipe");
$recipe = $image = $json = null;
$imageDir = $imageUrlPath = "";

//site title
$title = getConfig("defaultTitle");

//default meta tags
$meta = array();
$meta["og:title"] = $title;
$meta["og:site_name"] = $title; //get root dir title	
$meta["description"] = $meta["og:description"] = getConfig("description");
$meta["og:url"] = currentUrlDir(); 

if($recipeid)
{
	$url = getRecipeUrl($recipeid);
	debug("getRecipeUrl", $url);
	$json = curlGet($url);
	debug("json", !!$json);
}
//parse JSON
if($json)
{
	$data = json_decode($json);
	$data = objToArray($data, false, false, true);
	$recipe = arrayGet($data, "Data.Recipe");
	$title = $recipe["Name"] . " - $title";

	$meta["og:title"] = $recipe["Name"] ;
	$meta["description"] = $meta["og:description"] = cutAfterSentence($recipe["Description"], 300);
	$meta["og:url"] = combine(currentUrlDir(), "?recipe=$recipeid");

	//get recipe 1st image according to config
	$imageDir = combine(getConfig("images._rootdir"), getConfig("images.dir"), $recipeid);	
	$imageUrlPath = combine(getConfig("images.root"), getConfig("images.dir"), $recipeid);	
	$config["recipeImagesDir"] = $imageDir;
	$image = findFirstImage($imageDir);
	$config["image"] = $image;
}
$pdjConfig = $config;
debugText("</div>");
?>
<head>
<title><?php echo $title?></title>

<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi" />
<meta name="mobile-web-app-capable" content="yes" />
<?php echo metaTagArray($meta);
if($recipe)
	metaImage($imageUrlPath, $imageDir, $image);
?>

<link rel="stylesheet" href="/mt/MediaThingy.css">
<link rel="stylesheet" href="pdj.css">
<link rel="icon" href="images/PJgreen32.png">
<link rel="icon" sizes="192x192" href="images/PJgreen192.png">
<link rel="icon" sizes="128x128" href="images/PJgreen128.png">
<link rel="apple-touch-icon" sizes="128x128" href="images/PJgreen128.png">
<link rel="apple-touch-icon-precomposed" sizes="128x128" href="images/PJgreen128.png">

<script type="text/javascript" src="js/jquery.min.js"></script>
<script type="text/javascript" src="/mt/js/lib/jquery-ui-1.9.2.custom.min.js"></script>

<script type="text/javascript" src="js/angular.min.js"></script>
<script type="text/javascript" src="js/angular-route.min.js"></script>
<script type="text/javascript" src="js/angular-resource.min.js"></script>
<script type="text/javascript" src="js/angular-sanitize.min.js"></script>
<script type="text/javascript" src="js/angular-animate.min.js"></script>
<script type="text/javascript" src="js/pdj.app.js"></script>
<script type="text/javascript" src="js/pdj.services.js"></script>
<script type="text/javascript" src="js/pdj.controllers.js"></script>

<script type="text/javascript" src="/mt/js/mt.extensions.js"></script>
<script type="text/javascript" src="/mt/js/mt.extensions.jquery.js"></script>
<script type="text/javascript" src="/mt/js/mt.user.js"></script>
<script type="text/javascript" src="/mt/js/mt.mediafile.js"></script>
<script type="text/javascript" src="/mt/js/mt.album.js"></script>
<script type="text/javascript" src="/mt/js/mt.transition.js"></script>
<script type="text/javascript" src="/mt/js/mt.slideshow.js"></script>
<script type="text/javascript" src="/mt/js/mt.html5player.js"></script>
<?php if(!$offline)	addJavascript("https://www.youtube.com/iframe_api"); ?>

<script type="text/javascript">
<?php echoJsVar("pdjConfig"); echoJsVar("url"); echoJsVar("recipe"); 
?>
if(recipe)
	window.location = "./#/recipe/" + recipe.ID;
</script>

</head>
<body class="nomargin bgwhite" ng-controller="LayoutController">
	<div class="nomargin bg" ng-style="{ 'background-image': backgroundImage }">
	</div>
	<div id="content" class="noscroll aboveFooter translucentWhite">
		<div id="main" class="scrollY" ng-view>
		</div>
	</div>

	<div id="header" class="bgwhite headerLeftCorner stretchW boxShadow0">
		<a href="./">
			<img class="floatL marginH stretchH" src="images/PimentJourVertOrange200.png" alt="PDJ"/>
		</a>
		<a class="floatR" href="#/login">Log in</a>
		{{mode()}}
		<?php debugVar("offline"); debugVar("recipeid"); debugVar("recipeImagesDir"); debugVar("image"); ?>
		<div id="mainMenu" class="stretchH tabs noprint">
			<a ng-class="{'active': mode()=='list' || mode()=='recipe'}" href="#">Recipes</a>
			<a ng-class="{'active': mode()=='article'}" href="#/about">About</a>
		</div>
	</div>

	<div id="footer" class="footerLeftCorner small bold centered translucent stretchW hidden">
		{{title()}} {{windowWidth}} x {{windowHeight}} {{userAgent}}
	</div>
</body>
</html>