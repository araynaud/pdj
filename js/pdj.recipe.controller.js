'use strict';

// =========== RecipeController ===========
angular.module('pdjControllers')
.controller('RecipeController', ['$scope', '$window', '$state', '$stateParams', 'RecipeService',  
function ($scope, $window, $state, $stateParams, RecipeService)
{
    var rc = this;
    window.RecipeController = this;
    RecipeController.scope = $scope;

    rc.init = function()
    {
      rc.query="";
      rc.selectedCategories={};
      rc.plural = plural;
      rc.loading = false;
      rc.recipe = {};
      rc.article = {};
      rc.imgConfig = RecipeService.getConfig("images");
      rc.dropdown = RecipeService.getConfig("dropdown");
      rc.showDebug = ConfigService.isDebug();
      rc.hasPhoto = false;

      rc.getCategoryTypes();
      
      if($stateParams.recipeId)
        return rc.getRecipe($stateParams.recipeId);

      if(rc.stateIs('about'))
        return rc.getArticle('GetAboutArticle');

      if($stateParams.articleId)
        return rc.getArticle($stateParams.articleId);
      
      if($stateParams.search) 
        rc.query = $stateParams.search;

      return rc.getRecipeList();
    };

    rc.selectedCategoriesArray = function()
    {
      return Object.values(rc.selectedCategories).filter(function(el) { return !!el; });
    };

    rc.stateIs = function(st)
    {
        return $state.is(st);
    };

    rc.currentState = function()
    {
        return $state.current.name;
    };

    rc.errorMessage =  function (result)
    {
      rc.loading = false;
      rc.status = "Error: No data returned";
    };

    rc.successMessage =  function (result)
    {
      rc.loading = false;
      rc.status = "";
    };

    rc.getRecipeList = function(search)
    {
      rc.loading = true;
      search = valueOrDefault(search, rc.query);

      RecipeService.getList(search, rc.selectedCategoriesArray()).then(function(response) 
      {
          rc.list = response; 
          rc.successMessage();
      }, 
      rc.errorMessage);
    };

    // Bind the data returned from web service to $scope
    rc.addData = function(key, data)
    {
      rc[key]= data;
      return data;
    };

    rc.getRecipe = function(id)
    {
      var r = RecipeService.getRecipe(id);
      if(!r.then)
         rc.recipe = r;    
      else
      {
        rc.loading = true;
        r.then(function(response) 
        {
            rc.recipe = response; 
            rc.successMessage();
        }, 
        rc.errorMessage);
      }

      if($window.Album)
      {
        var path = String.combine( RecipeService.getConfig("MediaThingy.imagesRoot"), RecipeService.getConfig("images.dir"), id);
        Album.getAlbumAjax("album", {path: path }, true);
      }

    };

    if($window.Album)
    {
      //use proxy script if cross domain
      Album.serviceUrl = RecipeService.getConfig("MediaThingy.root"); 
      Album.proxy = RecipeService.getConfig("api.proxy");

      Album.onLoad = function (albumInstance) 
      {
        rc.recipe.pics = albumInstance.selectSlideshowFiles();
        rc.hasPhoto = !isEmpty(rc.recipe.pics);
        $scope.$apply();

        var mtOptions = RecipeService.getConfig("MT.album");
        albumInstance.setOptions(mtOptions);

        mtOptions = RecipeService.getConfig("MT.slideshow") || {}
        mtOptions.elements = {container: "#slideshowContainer"};
        mtOptions.pics = rc.recipe.pics;
        window.slideshow = new Slideshow(mtOptions);
        slideshow.display();
        $window.addEventListener("resize", function() { slideshow.fitImage() } );
      };
    }

    rc.getArticle = function(id)
    {
      var r = RecipeService.getArticle(id);
      if(!r.then)
          return rc.article = r;

      rc.loading = true;
      r.then(function(response) 
      {
          rc.article = response; 
          rc.successMessage();
      }, 
      rc.errorMessage);
    };

    rc.setTitle = function(t)
    {
      RecipeService.title = t;
//       $scope.$apply();
    };

    rc.linkOnClick = function(e)
    {
      rc.setTitle(this.innerHTML);
    }

    rc.getArticleHtml = function()
    {
       rc.articleHtml = String.parseKeywords(rc.article.Text,
        'piment du jour|cooking|food', "<a href='#{0}' class='bold piment'>{0}</a>");
       angular.element("a.piment").unbind("click").bind("click", rc.linkOnClick);
       return rc.articleHtml;
    }

    rc.recipePhotoUrl = function(recipe, size)
    {
      if(!recipe) return null;
      size = valueOrDefault(size, 1);

      var id = recipe.RecipeID || recipe.Recipe.ID;
      var imageUrl = id+".jpg";
      var subdir = rc.imgConfig.subdirs[size] || "";
      subdir="."+subdir;
      if(!id || !imageUrl)
        return String.combine(rc.imgConfig.root, rc.imgConfig.dir, rc.imgConfig.default);

      if(!rc.imgConfig.idDir) 
        id="";
      return String.combine(rc.imgConfig.root, rc.imgConfig.dir, id, subdir, imageUrl);
    };

    rc.getCategoryTypes = function()
    {
      var r = RecipeService.getCategoryTypes();
      if(!r.then)
      {
          rc.categoryTypes = r;
          rc.categoryTypeNames = RecipeService.categoryTypeNames;
          rc.categoryNames = RecipeService.categoryNames;
      }
      else
        r.then(function(response) 
        {
            rc.categoryTypes = response; 
            rc.categoryTypeNames = RecipeService.categoryTypeNames;
            rc.categoryNames = RecipeService.categoryNames;
        }, 
        rc.errorMessage);
    };

    rc.title = function()
    {
        var defaultTitle = RecipeService.getConfig("defaultTitle");
        document.title = String.append(RecipeService.title, " - ", defaultTitle);
        return RecipeService.title || defaultTitle; 
    };

    rc.displayProperty = function(obj, key, label)
    {
        if(!obj || isMissing(obj[key])) return;
        if(!label) label = String.makeTitle(key);
        return label + ": " + obj[key] + "\n";
    }


    // https://twitter.com/intent/tweet?text=Pasta with Homemade Tomato Sauce&via=Piment Du Jour&url=http://pimentdujour.com/pdj/%23/recipe/1

    rc.directLinkUrl = function()
    {
      var currentUrl = $window.location.href.substringBefore("#").substringBefore("?");
      if(!rc.recipe) return currentUrl;
      var id = (rc.recipe && rc.recipe.Recipe) ? rc.recipe.Recipe.ID : null;
      if(id)
        currentUrl += "?recipe=" + id;
      return currentUrl;
    };

    rc.shareUrl = function(site)
    {
      var url = RecipeService.getConfig("share."+site);
      if(!site || !url) return rc.directLinkUrl();

      var currentUrl = rc.directLinkUrl();
      return url.format(escape(currentUrl), rc.title(), "PimentDuJour");
    };

    rc.init();
}]);
