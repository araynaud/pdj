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

      rc.getCategoryTypes();
      rc.loadUnits();

      if(RecipeService.stateIs('about'))
        return rc.getArticle('GetAboutArticle');

      if($stateParams.recipeId)
        return rc.getRecipe($stateParams.recipeId);

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
      {
         rc.form = rc.recipe = r;    
         rc.initEditForm();
      }
      else
      {
        rc.loading = true;
        r.then(function(response) 
        {
            if(rc.error = rc.isError(response))
            {
              rc.errorMessage(response);
              return rc.cancelEdit(2000);
            }

            rc.form = rc.recipe = response;
            rc.initEditForm();
            rc.successMessage();
        }, 
        rc.errorMessage);
      }

      if(RecipeService.stateIs('recipe') && $window.Album)
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

    rc.getCategoryTypes = function()
    {
      var r = RecipeService.getCategoryTypes();
      if(!r.then)
      {
          rc.categoryTypes = r;
          rc.categoryTypeNames = RecipeService.categoryTypeNames;
          rc.categoryNames = RecipeService.categoryNames;
          rc.categories = RecipeService.categories;
      }
      else
        r.then(function(response) 
        {
            rc.categoryTypes = response; 
            rc.categoryTypeNames = RecipeService.categoryTypeNames;
            rc.categoryNames = RecipeService.categoryNames;
            rc.categories = RecipeService.categories;

            if(rc.recipe)
              RecipeService.refreshRecipeCategories(rc.recipe);
            if(rc.list)
              for(var i=0; i<rc.list.length; i++)
                RecipeService.refreshRecipeCategories(rc.list[i]);
        }, 
        rc.errorMessage);
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
