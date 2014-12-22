'use strict';

var pdjControllers = angular.module('pdjControllers', ['ngSanitize']);

// =========== RecipeController ===========

pdjControllers.controller('RecipeController', ['$scope', '$window', '$routeParams', 'RecipeService',  
function ($scope, $window, $routeParams, RecipeService)
{
  $scope.query="";
  $scope.showSearch= ($window.innerWidth >= 1000);
  $scope.selectedCategories={};
  $scope.plural = plural;
  $scope.loading = false;
  $scope.recipe = {};
  $scope.article = {};
  $scope.config = pdjApp.config;
  $scope.hasPhoto = false;

  $scope.selectedCategoriesArray= function()
  {
    return Object.values($scope.selectedCategories).filter(function(el)
    { return !!el; });
  };

  $scope.init = function()
  {
    if($routeParams.recipeId)
      return $scope.getRecipe($routeParams.recipeId);

    if($routeParams.articleId)
      return $scope.getArticle($routeParams.articleId);
    
    if($routeParams.search) 
      $scope.query=$routeParams.search;

    return $scope.getRecipeList();
  } 

  $scope.errorMessage =  function (result)
  {
    $scope.loading = false;
    $scope.status = "Error: No data returned";
  };

  $scope.successMessage =  function (result)
  {
    $scope.loading = false;
    $scope.status = "";
  };

  $scope.getRecipeList = function(search)
  {
    $scope.loading = true;
    search = valueOrDefault(search, $scope.query);

    RecipeService.getList(search, $scope.selectedCategoriesArray()).then(function(response) 
    {
        $scope.list = response; 
        $scope.successMessage();
    }, 
    $scope.errorMessage);
  };

 // Bind the data returned from web service to $scope
  $scope.addData = function(key, data)
  {
    $scope[key]= data;
    return data;
  };

  $scope.getRecipe = function(id)
  {
    var r = RecipeService.getRecipe(id);
    if(!r.then)
       $scope.recipe = r;    
    else
    {
      $scope.loading = true;
      r.then(function(response) 
      {
          $scope.recipe = response; 
          $scope.successMessage();
      }, 
      $scope.errorMessage);
    }

    if($window.Album)
      Album.getAlbumAjax("album", {path: String.combine(pdjApp.config.imagesDir, id) }, true); //, albumOnLoad);

  };

  if($window.Album)
  {
    Album.serviceUrl = pdjApp.config.MediaThingyRoot; 
    Album.onLoad = function (albumInstance) 
    {
      $scope.recipe.pics = albumInstance.selectSlideshowFiles();
      $scope.hasPhoto = !isEmpty($scope.recipe.pics);
      $scope.$apply();

      albumInstance.setOptions({border:false, margin:false, shadow:false});
      var options={
        play: true,
        interval: 6000,
        pics: $scope.recipe.pics,
        alignX:"center",
        alignY:"center",
        zoom: 2,
        type: 2,
//        animate: true,
        elements: {container: "#slideshowContainer"}
      };
      var slideshow = new Slideshow(options);
      slideshow.display();
      $window.addEventListener("resize", function() { slideshow.fitImage() } );
    };
  }

  $scope.getArticle = function(id)
  {
    var r = RecipeService.getArticle(id);
    if(!r.then)
        return $scope.article = r;

    $scope.loading = true;
    r.then(function(response) 
    {
        $scope.article = response; 
        $scope.successMessage();
    }, 
    $scope.errorMessage);
  };

  $scope.setTitle = function(t)
  {
    RecipeService.title = t;
     $scope.$apply();
  };

  $scope.linkOnClick = function(e)
  {
    $scope.setTitle(this.innerHTML);
  }

  $scope.getArticleHtml = function()
  {
     $scope.articleHtml = String.parseKeywords($scope.article.Text,
      'piment du jour|cooking|food', "<a href='#{0}' class='bold piment'>{0}</a>");
     angular.element("a.piment").unbind("click").bind("click", $scope.linkOnClick);
     return $scope.articleHtml;
  }

  $scope.recipePhotoUrl = function(recipe, size)
  {
    if(!recipe) return null;
    size = valueOrDefault(size, 1);

    var id = recipe.RecipeID || recipe.Recipe.ID;
    var imageUrl = id+".jpg";
    var subdir = pdjApp.config.subdirs[size] || "";
    subdir="."+subdir;
    if(!id || !imageUrl)
      return String.combine(pdjApp.config.imagesRoot, pdjApp.config.imagesDir, pdjApp.config.defaultImage);

    if(pdjApp.config.recipeIdDir)
      return String.combine(pdjApp.config.imagesRoot, pdjApp.config.imagesDir, id, subdir, imageUrl);

    return String.combine(pdjApp.config.imagesRoot, pdjApp.config.imagesDir, subdir, imageUrl);
  };

  $scope.getCategoryTypes = function()
  {
    var r = RecipeService.getCategoryTypes();
    if(!r.then)
    {
        $scope.categoryTypes = r;
        $scope.categoryTypeNames = RecipeService.categoryTypeNames;
        $scope.categoryNames = RecipeService.categoryNames;
    }
    else
      r.then(function(response) 
      {
          $scope.categoryTypes = response; 
          $scope.categoryTypeNames = RecipeService.categoryTypeNames;
          $scope.categoryNames = RecipeService.categoryNames;
      }, 
      $scope.errorMessage);
  };

  $scope.title = function()
  {
    document.title = RecipeService.title ? RecipeService.title + " - " + pdjApp.config.defaultTitle : pdjApp.config.defaultTitle;
    return RecipeService.title || pdjApp.config.defaultTitle;
  };

  $scope.displayProperty = function(obj, key, label)
  {
      if(!obj || isMissing(obj[key])) return;
      if(!label) label = String.makeTitle(key);
      return label + ": " + obj[key] + "\n";
  }


// https://twitter.com/intent/tweet?text=Pasta with Homemade Tomato Sauce&via=Piment Du Jour&url=http://pimentdujour.com/pdj/%23/recipe/1

    $scope.directLinkUrl = function()
    {
      var currentUrl = window.location.href.substringBefore("?");
      var id = $scope.recipe.Recipe.ID;
      if(id)
        currentUrl += "?recipeid=" + id;
      return currentUrl;
    };

    $scope.shareUrl = function(site)
    {
      var url = pdjApp.config.share[site];
      if(!site || !url) return $scope.directLinkUrl();

      var currentUrl = $scope.directLinkUrl();
      return url.format(escape(currentUrl), $scope.title(), "PimentDuJour");
    };


  $scope.getCategoryTypes();
  $scope.init();
}]);

// =========== LayoutController ===========

pdjControllers.controller('LayoutController', ['$scope', '$window', 'RecipeService', 
function ($scope, $window, RecipeService)
{
    if(pdjApp.config.backgroundImage)
        $scope.backgroundImage = "url({0})".format(pdjApp.config.backgroundImage);

    $scope.getWindowSize = function()
    {
        $scope.windowWidth  = $window.innerWidth;
        $scope.windowHeight = $window.innerHeight;
        $scope.$apply();
    };

    $window.addEventListener("load",   $scope.getWindowSize);
    $window.addEventListener("resize", $scope.getWindowSize);

    $scope.width = function()
    {
      return $window.innerWidth;
    };

    $scope.isPortrait = function()
    {
      return $window.innerWidth <= $window.innerHeight;      
    };

    $scope.isWider = function(min)
    {
      return $window.innerWidth >= min;      
    };

    $scope.title = function()
    {
      document.title = RecipeService.title ? RecipeService.title + " - " + pdjApp.config.defaultTitle : pdjApp.config.defaultTitle;
      return RecipeService.title || pdjApp.config.defaultTitle;
    };

    $scope.mode = function()
    {
      return RecipeService.mode;
    };

    $scope.userAgent = navigator.userAgent;

}]); 
