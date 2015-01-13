<?php
$MT_DIR = "../mt";
$MT_DIR = "../../MediaThingy";
require_once("$MT_DIR/include/http_functions.php");
require_once("$MT_DIR/include/text_functions.php");
require_once("$MT_DIR/include/debug_functions.php");
require_once("$MT_DIR/include/dir_functions.php");
require_once("$MT_DIR/include/file_functions.php");
require_once("$MT_DIR/include/ui_functions.php");
require_once("$MT_DIR/include/json_xml_functions.php");

//get recipe id and parameters from query string, 
$pdjConfig = readConfigFile("pdj.config");
$recipeid = @$_REQUEST["recipe"];
$recipe = null;
$meta = null;
$title = "Piment du Jour";
if($recipeid)
{
	$pdjApiRoot = "http://www.pimentdujour.com/api/";
	$url = $pdjApiRoot . "Recipes/GetRecipeDetails?recipeId=$recipeid";
//call service
	$json = curlGet($url);
//parse JSON
	$data = json_decode($json);
	$data = objToArray($data, false, false, true);
	$recipe = arrayGet($data, "Data.Recipe");
	$title = $recipe["Name"] . " - $title";

	$meta = array();
	$meta["og:title"] = $recipe["Name"];
	$meta["description"] = $recipe["Description"];
	$meta["og:description"] = $recipe["Description"];

	$image = findFirstImage("icons");
//	if(!$image)	$image = "http://www.pimentdujour.com/images/RecipeImages/8/.ss/8.JPG";
	if($image)
		$meta["og:image"] = $image; //get recipe 1st image according to config
}
?>
<!doctype html>
<html ng-app="pdjApp">
<head>
<title><?php echo $title?></title>

<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi" />
<meta name="mobile-web-app-capable" content="yes" />
<?php echo metaTagArray($meta); ?>

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
<script type="text/javascript" src="js/pdj.config.js"></script>
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
<script type="text/javascript" src="https://www.youtube.com/iframe_api"></script>

<script type="text/javascript">
<?php echoJsVar("pdjConfig");  echoJsVar("url"); echoJsVar("recipe"); ?>
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
		{{mode()}} <?php echo $recipeid ?>
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