'use strict';

// =========== RecipeController ===========
angular.module('pdjControllers').
controller('RecipeController', ['$scope', '$window', '$routeParams', 'RecipeService',  
function ($scope, $window, $routeParams, RecipeService)
{
    window.RecipeController = this;
    RecipeController.scope = $scope;
    $scope.query="";
    $scope.showSearch= ($window.innerWidth >= 1000);
    $scope.selectedCategories={};
    $scope.plural = plural;
    $scope.loading = false;
    $scope.recipe = {};
    $scope.article = {};
    $scope.config = $window.pdjConfig;
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
      {
        var path = String.combine($scope.config.MediaThingy.imagesRoot, $scope.config.images.dir, id);
        Album.getAlbumAjax("album", {path: path }, true); //, albumOnLoad);
      }

    };

    if($window.Album)
    {
      //use proxy script if cross domain
      Album.serviceUrl = $scope.config.MediaThingy.root; 
      Album.proxy = $scope.config.pdjApi.proxy;

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
      var subdir = $scope.config.images.subdirs[size] || "";
      subdir="."+subdir;
      if(!id || !imageUrl)
        return String.combine($scope.config.images.root, $scope.config.images.dir, $scope.config.images.default);

      if(!$scope.config.images.idDir) 
        id="";
      return String.combine($scope.config.images.root, $scope.config.images.dir, id, subdir, imageUrl);
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
      document.title = RecipeService.title ? RecipeService.title + " - " + $scope.config.defaultTitle : $scope.config.defaultTitle;
      return RecipeService.title || $scope.config.defaultTitle;
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
        var currentUrl = $window.location.href.substringBefore("#").substringBefore("?");
        if(!$scope.recipe) return currentUrl;
        var id = ($scope.recipe && $scope.recipe.Recipe) ? $scope.recipe.Recipe.ID : null;
        if(id)
          currentUrl += "?recipe=" + id;
        return currentUrl;
      };

      $scope.shareUrl = function(site)
      {
        var url = $scope.config.share[site];
        if(!site || !url) return $scope.directLinkUrl();

        var currentUrl = $scope.directLinkUrl();
        return url.format(escape(currentUrl), $scope.title(), "PimentDuJour");
      };


    $scope.getCategoryTypes();
    $scope.init();
}]);
