<!doctype html>
<html ng-app="pdjApp">
<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('display_errors', '1');

require_once("include/includes.php");
session_start();

function getRecipeUrl($id)
{
	if(!$id) return;

	if(getConfig("debug.offline"))
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
debugText("<div id='php_debug' class='footerRightCorner left text controls photoBorder bgwhite'>DEBUG");
$offline = getConfig("debug.offline");
$recipeid = reqParam("recipe");
$recipe = $image = $json = null;
$imageDir = $imageUrlPath = "";

$pdjUser = pdjCurrentUser();
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
debugText("</div>");
?>
<head>
<title><?php echo $title?></title>

<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="mobile-web-app-capable" content="yes" />
<?php echo metaTagArray($meta);
if($recipe)
	metaImage($imageUrlPath, $imageDir, $image);
?>

<link rel="icon" href="images/PJgreen32.png"/>
<link rel="icon" sizes="192x192" href="images/PJgreen192.png"/>
<link rel="icon" sizes="128x128" href="images/PJgreen128.png"/>
<link rel="apple-touch-icon" sizes="128x128" href="images/PJgreen128.png"/>
<link rel="apple-touch-icon-precomposed" sizes="128x128" href="images/PJgreen128.png"/>

<?php
	addCssFromConfig("lib.bootstrap"); 
	addAllCss("../foodportrait/style");
	addCssFromConfig("MediaThingy", "../MediaThingy.css");
	addAllCss(".");
	addScriptFromConfig("lib", "jquery.min.js");
	addScriptFromConfig("lib.bootstrap");
	addScriptFromConfig("lib.angular"); 
	addScriptFromConfig("lib"); 
	addScriptFromConfig("MediaThingy");
	addAllScripts("js");
	if(!$offline)	
		addJavascript("https://www.youtube.com/iframe_api"); 
?>

<script type="text/javascript">
<?php echoJsVar("pdjConfig"); echoJsVar("pdjUser"); echoJsVar("url"); echoJsVar("recipe"); ?>
if(recipe)
	window.location = "./#/recipe/" + recipe.ID;
</script>

</head>
<body class="nomargin bgwhite" ng-class="lc.bodyClasses()" ng-controller="LayoutController as lc">
	<div class="nomargin bg" ng-style="{ 'background-image': lc.backgroundImage }" ng-if="lc.backgroundImage">
		<div class="translucentWhite stretchH"></div>
	</div>

	<!-- Static navbar -->
	<nav class="navbar navbar-default navbar-fixed-top">
	<div class="container">
	    <a class="navbar-brand" ng-class="{active: lc.stateIs('main')}" href="#/main">
	      <img class="stretchH" src="images/PimentJourVertOrange200.png" alt="PDJ"/>
	    </a>

	  <div class="navbar-header">
	    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".isMobile #navbar" aria-expanded="false" aria-controls="navbar">
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	    </button>
	  </div>

	  <div id="navbar" class="navbar-collapse collapse">
	    <ul class="nav navbar-nav">
	      <li ng-class="{active: lc.stateIs('list')}" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="list">Recipes</a></li>
	      <li ng-class="{active: lc.stateIs('article')}" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="about">About</a></li>
	      <li ng-show="lc.loggedIn()" ng-class="{active: lc.stateIs('upload')=='upload'}"  data-toggle="collapse" data-target=".isMobile #navbar"><a href="#/upload/">Upload</a></li>
	    </ul>
	    <ul class="nav navbar-nav navbar-right">
	      <li ng-hide="lc.loggedIn()" ng-class="{active: lc.stateIs('signin')}" data-toggle="collapse" data-target=".isMobile #navbar"><a href="#/signin">Log in</a></li>
	      <li ng-hide="lc.loggedIn()" ng-class="{active: lc.stateIs('signup')}" data-toggle="collapse" data-target=".isMobile #navbar"><a href="#/signup">Sign up</a></li>
	      <li ng-show="lc.loggedIn()" ng-class="{active: lc.stateIs('user')}"   data-toggle="collapse" data-target=".isMobile #navbar"><a href="#/main">{{lc.userFullName()}}</a></li>
	      <li ng-show="lc.loggedIn()" data-toggle="collapse" data-target=".isMobile #navbar"><a href="#/login" ng-click="lc.logout()">Sign out</a></li>
	    </ul>
	  </div>
	</div>
	</nav>
  
  <div id="main" ui-view></div>

  <footer class="footer container nowrap" ng-if="lc.showDebug">
    <div class="text-muted"> {{lc.currentState()}} / {{lc.getBootstrapSize()}} {{lc.windowWidth}} x {{lc.windowHeight}} / {{lc.userAgent}}</div>
  </footer>
</body>
</html>