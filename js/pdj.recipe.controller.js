'use strict';

// =========== RecipeController ===========
angular.module('pdjControllers')
.controller('RecipeController', ['$scope', '$window', '$stateParams', 'RecipeService',  
function ($scope, $window, $stateParams, RecipeService)
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
      rc.error = false;
      rc.status = "";
      
      initAlbum();

      rc.loadUnits();
      rc.loadCategoryTypes();
      if(rc.categoryTypes)
        rc.loadData();
    };

//data load functions
    rc.loadData = function()
    {
      if(RecipeService.stateIs('about'))
        return rc.loadArticle('GetAboutArticle');

      if($stateParams.recipeId)
        return rc.loadRecipe($stateParams.recipeId);

      if($stateParams.articleId)
        return rc.loadArticle($stateParams.articleId);
      
      return rc.loadRecipeList($stateParams.search);

    };

    rc.loadUnits = function()
    { 
      if(!rc.units)
        RecipeService.loadUnits(rc).then(function() 
        { 
          rc.units.byId = rc.units.indexBy("ID");
          rc.units.byType = rc.units.groupBy("unitType");
          rc.YieldUnit = rc.units[0]; 
        });
    };

    //load CategoryTypes once if needed
    rc.loadCategoryTypes = function()
    {
      rc.categoryTypes = RecipeService.categoryTypes;

      if(!rc.categoryTypes)
          RecipeService.loadCategoryTypes().then(function(response) 
          {
              rc.categoryTypes = response; 
              rc.loadData();
          }, 
          rc.errorMessage);
    };

    rc.loadRecipeList = function(search)
    {
      rc.loading = true;
      rc.getSearchCategories(search);

      RecipeService.loadRecipeList(rc.query, rc.selectedCategoriesArray()).then(function(response) 
      {
          rc.loading = false;
          rc.list = response; 
          rc.successMessage();
      }, 
      rc.errorMessage);
    };

    rc.loadArticle = function(id)
    {
      rc.loading = true;
      RecipeService.loadArticle(id).then(function(response) 
      {
          rc.loading = false;
          if(rc.error = rc.isError(response))
          {
            rc.errorMessage(response);
            return RecipeService.returnToMain(2000);
          }

          rc.article = response; 
          rc.successMessage();
      }, 
      rc.errorMessage);
    };

    rc.loadRecipe = function(id)
    {
      rc.loading = true;
      RecipeService.loadRecipe(id).then(function(response) 
      {
          rc.loading = false;
          if(rc.error = rc.isError(response))
          {
            rc.errorMessage(response);
            return RecipeService.returnToMain(2000);
          }

          rc.form = rc.recipe = response;
          rc.initEditForm();
          rc.successMessage();
      }, 
      rc.errorMessage);

      //load photo slideshow
      if(RecipeService.stateIs('recipe') && $window.Album)
      {
        var path = String.combine( RecipeService.getConfig("MediaThingy.imagesRoot"), RecipeService.getConfig("images.dir"), id);
        Album.getAlbumAjax("album", {path: path }, true);
      }

    };

    rc.selectedCategoriesArray = function()
    {
      return Object.values(rc.selectedCategories).filter(function(el) { return !!el; });
    };

    //if no image loaded, remove thumbnail container
    rc.removeImage = function(element)
    {
        element.parent().remove();
    };

    rc.errorMessage =  function (response)
    {
      rc.loading = false;
      rc.status = response.Exception ? response.Exception.Message : response.Message || "Error: No data returned";
    };

    rc.successMessage =  function (response)
    {
      rc.loading = false;
      rc.status = response ? response.Message : "";
    };

    rc.getSearchCategories = function(search)
    {
        if(!search || !RecipeService.categoriesByName) return search;

        var words = search.toLowerCase().split(" ");
        var cat = null;

        rc.selectedCategories = {};
        for(var i=0; i<words.length; i++)
        {
          if(cat = RecipeService.categoriesByName[words[i]])
          {
            rc.selectedCategories[cat.ID] = cat.ID;
            words[i] = "";
          }
        }
        rc.query = words.join(" ");
        return rc.query;
    }

    function initAlbum()
    {
        if(!$window.Album) return;

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
    };

    //prepare data for edit form
    rc.initEditForm = function()
    {
      //if(RecipeService.stateIs('recipe')) return;

      rc.form = rc.recipe;
      rc.selectedCategories = rc.recipe.CategoryIDs.toMap();
      rc.form2 = {};
      if(!isEmpty(rc.recipe.RecipeIngredients))
      {
        rc.form2.ingredients = rc.recipe.RecipeIngredients.join("\n");
        rc.form2.directions  = rc.recipe.RecipeSteps.join("\n\n");
        rc.form2.tips        = rc.recipe.AllRecipeTips.join("\n");
        rc.form2.links       = rc.recipe.AllRecipeUrls.join("\n");
      }
      else if(rc.recipe.RawText)
      {
        rc.form2.ingredients = rc.recipe.RawText.substringAfter("INGREDIENTS:").substringBefore("DIRECTIONS:").trim();
        rc.form2.directions = rc.recipe.RawText.substringAfter("DIRECTIONS:").substringBefore("TIPS:").trim();
        rc.form2.tips = rc.recipe.RawText.substringAfter("TIPS:").substringBefore("LINKS:").trim();
        rc.form2.links = rc.recipe.RawText.substringAfter("LINKS:").trim();
      }
    }

    rc.setTitle = function(t)
    {
      RecipeService.title = t;
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

      var id = recipe.ID; // || recipe.Recipe.ID;
      var imageUrl = id+".jpg";
      var subdir = rc.imgConfig.subdirs[size] || "";
      subdir="."+subdir;
      if(!id || !imageUrl)
        return String.combine(rc.imgConfig.root, rc.imgConfig.dir, rc.imgConfig.default);

      if(!rc.imgConfig.idDir) 
        id="";
      return String.combine(rc.imgConfig.root, rc.imgConfig.dir, id, subdir, imageUrl);
    };

    rc.title = function()
    {
        var defaultTitle = RecipeService.getConfig("defaultTitle");
        document.title = String.append(RecipeService.title, " - ", defaultTitle);
        return RecipeService.title || defaultTitle; 
    };

    rc.displayProperty = function(obj, key, unit, label)
    {
        if(!obj || !obj[key]) return;
        if(!label) label = String.makeTitle(key);
        if(unit)
        {
          unit = rc.getUnit(unit);
          return label + ": " + plural(obj[key], unit.Name || unit, unit.PluralName) + "\n";
        }

        return label + ": " + obj[key] + "\n";
    };

    rc.getUnit = function(id)
    {
      var unit =  rc.units ? rc.units.byId[id] : null;
      return unit || id;
    };

    // https://twitter.com/intent/tweet?text=Pasta with Homemade Tomato Sauce&via=Piment Du Jour&url=http://pimentdujour.com/pdj/%23/recipe/1

    rc.directLinkUrl = function()
    {
      var currentUrl = $window.location.href.substringBefore("#").substringBefore("?");
      if(!rc.recipe) return currentUrl;
      var id = (rc.recipe) ? rc.recipe.ID : null;
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

    rc.saveRecipe = function()
    {
      rc.form.CategoryIDs = rc.selectedCategoriesArray();
      if(rc.YieldUnit)
        rc.form.YieldUnitTypeID = rc.YieldUnit.ID;

      rc.form.RawText = ""; 
      for(var key in rc.form2)
      {
        var value = rc.form2[key];
        if(key && value)
          rc.form.RawText += "\n{0}:\n{1}\n".format(key.toUpperCase(), value.trim());        
      }

      RecipeService.saveRecipe(rc.form).then(function(response) 
      {
          if(rc.isError(response))
            return rc.errorMessage(response);

         var id = response.Data;
         rc.successMessage();
         RecipeService.goToState("recipe", {recipeId: id});
      }, 
      rc.errorMessage);
    };

    this.isError = function(response)
    {
        return response.State == "ERROR";
    }

    rc.cancelEdit = RecipeService.returnToMain;

    rc.init();
}]);
