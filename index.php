<!doctype html>
<html ng-app="app">
<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('display_errors', '1');

//header("Access-Control-Allow-Origin: *");
require_once("include/includes.php");
session_start();

//get recipe id and parameters from query string, 
debugText("<div id='php_debug' class='footerLeftCorner left text controls photoBorder bgwhite'>DEBUG");
$offline = getConfig("debug.offline");
$recipeid = reqParam("recipe");
$search = reqParam("search");
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

$recipe = getRecipeDetail($recipeid);
if($recipe)
{
	if($name = arrayGet($recipe, "Name"))
	{
		$title = "$name - $title";
		$meta["og:title"] = $name;
	}
	
	if($desc = arrayGet($recipe, "Description"))
		$meta["description"] = $meta["og:description"] = cutAfterSentence($desc, 300);
	$meta["og:url"] = combine(currentUrlDir(), "?recipe=$recipeid");

	//get recipe 1st image according to config
	$imageDir = combine(getConfig("images._rootdir"), getConfig("images.dir"), $recipeid);	
	$imageUrlPath = combine(getConfig("images.root"), getConfig("images.dir"), $recipeid);	
	$image = findFirstImage($imageDir);
}
debugText("</div>");
?>
<head>
<title><?=$title?></title>
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="mobile-web-app-capable" content="yes" />
<?=metaTagArray($meta);?>
<?php
if($recipe) 
{	
	metaImage($imageUrlPath, $imageDir, $image); 
	redirectJs("./#/recipe/$recipeid", true);
	return;
} 
else if($search) 
{	
	redirectJs("./#/search/$search", true);
	return;
} 

addIconsFromConfig();
addCssFromConfig("lib.bootstrap"); 
addAllCss("../foodportrait/style");
addAllCss("../foodportrait/directives");
addCssFromConfig("MediaThingy", "../MediaThingy.css");
addAllCss(".");
addScriptFromConfig("lib", "jquery.min.js");
addScriptFromConfig("lib.bootstrap");
addScriptFromConfig("lib.angular"); 
addScriptFromConfig("lib"); 
addScriptFromConfig("MediaThingy");
addAllScripts("js");
addAllScripts("../foodportrait/directives");
if(!$offline)	
	addJavascript("https://www.youtube.com/iframe_api"); 
?>

<script type="text/javascript">
<?php echoJsVar("pdjConfig"); echoJsVar("pdjUser"); echoJsVar("url"); echoJsVar("recipe"); ?>
</script>
</head>
<body class="nomargin bgwhite" ng-class="lc.bodyClasses()" ng-controller="LayoutController as lc">
	<div class="nomargin bg hidden-print" ng-style="{ 'background-image': lc.backgroundImage }" ng-if="lc.backgroundImage">
		<div class="translucentWhite stretchH"></div>
	</div>

	<div class="visible-print-block" id="printHeader">
		<img class="floatL" style="height: 1cm;" src="images/<?=getConfig('app.logo.print')?>" alt="PDJ"/>
		<p class="centered title">{{lc.shortTitle()}}</p>
	</div>

	<nav class="navbar navbar-default navbar-fixed-top hidden-print">
	<div class="container">
	    <a class="navbar-brand" ng-class="{active: lc.stateIs('main')}" ui-sref="list">
	      <img class="stretchH" src="images/<?=getConfig('app.logo.default')?>" alt="PDJ"/>
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
	      <li ng-class="{active: lc.stateIs('about')}" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="about">About</a></li>
	      <li ng-show="lc.loggedIn()" ng-class="{active: lc.stateIs('submit')}"  data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="submit">Submit Recipe</a></li>
	    </ul>
	    <ul class="nav navbar-nav navbar-right">
	      <li ng-hide="lc.loggedIn()" ng-class="{active: lc.stateIs('signin')}" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="signin">Log in</a></li>
	      <li ng-hide="lc.loggedIn()" ng-class="{active: lc.stateIs('signup')}" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="signup">Sign up</a></li>
	      <li ng-show="lc.loggedIn()" ng-class="{active: lc.stateIs('user')}"   data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="list">{{lc.userFullName()}}</a></li>
	      <li ng-show="lc.loggedIn()" data-toggle="collapse" data-target=".isMobile #navbar"><a ui-sref="list" ng-click="lc.logout()">Sign out</a></li>

	      <li ng-show="lc.isAdmin()" data-toggle="collapse" data-target=".isMobile #navbar">
	      <a href="api/git.php">
	      	<i class="glyphicon glyphicon-refresh" title="Update from github"></i>
	      </a>
	      </li>


	    </ul>
	  </div>
	</div>
	</nav>
  
  <div id="main" ui-view></div>

  <footer class="footer nowrap" ng-if="lc.showDebug">
    <div class="text-muted"> {{lc.currentState()}} / {{lc.getBootstrapSize()}} {{lc.windowWidth}} x {{lc.windowHeight}} / {{lc.userAgent}}</div>
  </footer>
</body>
</html>