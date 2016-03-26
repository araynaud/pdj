'use strict';

// =========== RecipeController ===========
angular.module('pdjControllers')
.controller('RecipeController', ['$window', '$stateParams', '$timeout', 'RecipeService',  'AlbumService',
function ($window, $stateParams, $timeout, RecipeService, AlbumService)
{
    var rc = this;
    window.RecipeController = this;

    rc.init = function()
    {
      rc.query="";
      rc.selectedCategories={};
      rc.plural = plural;
      rc.loading = false;
      rc.split = true;
      //rc.recipe = {};
      rc.article = {};
      rc.filters = RecipeService.filters;
      rc.imgConfig = RecipeService.getConfig("images");
      rc.dropdown = RecipeService.getConfig("dropdown");
      rc.showDebug = RecipeService.isDebug();
      rc.hasPhoto = false;
      rc.error = false;
      rc.status = "";
      rc.isNew = RecipeService.stateIs("submit");    
      rc.isEdit = RecipeService.stateIs("edit");    
      rc.isView = RecipeService.stateIs("recipe");   
      rc.isMobile = RecipeService.isMobile();
      rc.isLoggedIn = RecipeService.isLoggedIn;
      rc.loadUnits();
      rc.loadCategoryTypes();
      if(rc.categoryTypes)
        rc.loadData();
    };

    rc.isError = RecipeService.isError;

    rc.isMine = function(recipe)
    {
        recipe = valueOrDefault(recipe, rc.recipe);
        return RecipeService.isMine(recipe);
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
      if(!RecipeService.units)
        RecipeService.loadUnits().then(rc.getUnits);
      else
        rc.getUnits(RecipeService.units);
    };

    rc.getUnits = function(units) 
    { 
      if(units) rc.units = units;
      if(!rc.units.byId)   rc.units.byId   = rc.units.indexBy("ID");
      if(!rc.units.byType) rc.units.byType = rc.units.groupBy("unitType");

      if(rc.isEdit && rc.recipe)
        rc.YieldUnit = rc.units.byId[rc.recipe.YieldUnitTypeID];
      else if(rc.isNew)
        rc.YieldUnit = rc.units[0]; 
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
          rc.filterRecipeList();
          rc.successMessage();
          RecipeService.scrollTop();
      }, 
      rc.errorMessage);
    };

    rc.orderArrow = function()
    {
        return rc.filters.reverse ? 'glyphicon-arrow-down': 'glyphicon-arrow-up';
    };

    rc.filterRecipeList = function()
    {
      rc.filteredList = rc.list; 
      if(!rc.filters) return rc.filteredList;

      if(rc.filters.hasPhoto)
        rc.filteredList = rc.filteredList .filterBy("hasPhoto", rc.filters.hasPhoto == "Yes")

      if(rc.filters.from)
        rc.filteredList = rc.filteredList.filterBy(rc.isMine, rc.filters.from == "Me")

      if(rc.filters.order)
      {        
        var field = rc.dropdown.sort[rc.filters.order];
        rc.filteredList.sortObjectsBy(field, rc.filters.reverse);
      }

      return rc.filteredList;
    }

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

          rc.recipe = response;
          console.log("recipe loaded " + response.ID);

          if(rc.units)
            rc.YieldUnit = rc.units.byId[rc.recipe.YieldUnitTypeID];

          rc.formatProperty(rc.recipe, "CookingTime", "minute");
          rc.formatProperty(rc.recipe, "PrepTime", "minute");
          rc.formatProperty(rc.recipe, "TotalTime", "minute");
          rc.formatProperty(rc.recipe, "Author", null, "Recipe by");
          rc.formatProperty(rc.recipe, "YieldCount", rc.recipe.YieldUnitTypeID , "Yield");

          if(!rc.recipe.RecipeLinks)
            rc.renameField(rc.recipe, "AllRecipeUrls", "RecipeLinks");

          if(rc.isView)
          {
            rc.parseRawText();
            rc.loadRecipeSlideshow();
          }
          else
            rc.initEditForm();

          rc.successMessage();
      }, 
      rc.errorMessage);

      RecipeService.loadRatings(id, rc);

    };

    rc.renameField = function(obj, from, to)
    {
      obj[to] = obj[from];
      obj[from] = null;
      delete obj[from];
    };

    //for RawText recipes only: split into ingredients, directions, tips 
    rc.parseRawText = function()
    {
      if(!rc.recipe.RawText) return;

      var rawText = rc.recipe.RawText;

      var tips = rawText.substringAfter("TIPS:");
      rc.recipe.AllRecipeTips = rc.splitLines(tips);
      rawText = rawText.substringBefore("TIPS:");

      var directions = rawText.substringAfter("DIRECTIONS:");
      rc.recipe.RecipeSteps = rc.splitLines(directions);
      rawText = rawText.substringBefore("DIRECTIONS:");

      var ingredients = rawText.substringAfter("INGREDIENTS:");
      rc.recipe.RecipeIngredients = rc.splitLines(ingredients);
    };

    //split and filter blank lines
    rc.splitLines = function(s)
    {
      if(!s) return [];
      return s.trim().split("\n").filter(function(s) { return s.trim(); });
    };

    rc.getRecipeAlbumPath = function()
    {
       if(!rc.recipe) return null;
       return String.combine(RecipeService.getConfig("MediaThingy.imagesRoot"), RecipeService.getConfig("images.dir"), rc.recipe.UserID, rc.recipe.ID);
    }

    rc.loadRecipeSlideshow = function()
    {
      //load photo slideshow
      if(!$window.Album) return;

      var path = rc.getRecipeAlbumPath();
      if(!path) return;

      AlbumService.loadAlbum(path).then(function(albumInstance)
      {
          rc.hasPhoto = AlbumService.hasPhoto();
          if(!rc.hasPhoto) return;

          rc.mainImage = AlbumService.getMainImage();
          rc.mainImageUrl = AlbumService.mainImageUrl();
          rc.pics = rc.removeDuplicates(AlbumService.pics);

          var mtOptions = RecipeService.getConfig("MT.slideshow") || {};
          mtOptions.pics = rc.pics;

          rc.slideshow = new Slideshow(mtOptions, albumInstance);
          rc.slideshow.setContainer("#slideshowContainer");
          rc.slideshow.display();
          rc.fitImage();
          $window.addEventListener("resize", function() { rc.slideshow.fitImage(); } );
      });
    };

    rc.removeDuplicates = function(pics)
    {
      if(!pics || !rc.mainImage) return pics;

      for(var i=0; i<pics.length; i++)
      {
        if(pics[i] == rc.mainImage) continue;
        if(pics[i].size[0] == rc.mainImage.size[0])
        {
          pics.remove(rc.mainImage)
          break;
        }
      }
      return pics;
    }

    //prepare data for edit form
    rc.initEditForm = function()
    {
      rc.form = rc.recipe;

      if(rc.recipe.ID) //for update
        rc.form.recipeID = rc.recipe.ID;

      rc.selectedCategories = rc.recipe.CategoryIDs.toMap();
      rc.form2 = { ingredients: "", directions: "", tips: "" };
      if(!isEmpty(rc.recipe.RecipeIngredients))
      {
        rc.form2.ingredients = rc.recipe.RecipeIngredients.join("\n");
        rc.form2.directions  = rc.recipe.RecipeSteps.join("\n");
        rc.form2.tips        = rc.recipe.AllRecipeTips.join("\n");
      }
      else if(rc.recipe.RawText)
      {
        rc.form2.ingredients = rc.recipe.RawText.substringAfter("INGREDIENTS:").substringBefore("DIRECTIONS:").trim();
        rc.form2.directions = rc.recipe.RawText.substringAfter("DIRECTIONS:").substringBefore("TIPS:").trim();
        rc.form2.tips = rc.recipe.RawText.substringAfter("TIPS:").trim();
      }
    };

    rc.loadLinkMetadata = function()
    {
      if(!rc.form2.links) return;

      var links = rc.form2.links.split(" ");

      if(!rc.form.RecipeLinks)
        rc.form.RecipeLinks = [];

      for(var i=0; i<links.length;i++)
      {
        //skip if duplicate URL
        if(rc.form.RecipeLinks[links[i]]) continue;

        RecipeService.loadLinkMetadata(links[i]).then(function(response)
        {
            console.log(response);
            if(!response.title) return;

            if(rc.form.RecipeLinks[response.url]) return;

            var pl = { LinkUrl: response.url, LinkTitle: response.title };
            if(response.meta)
            {
              pl.description = response.meta["og:description"] || response.meta.description;
              pl.image = response.meta["twitter:image"]  || response.meta["og:image"];
            }
            rc.form.RecipeLinks.push(pl);
            rc.form.RecipeLinks[pl.LinkUrl] = pl; //to test for duplicates
        });
      }
      rc.form2.links = "";
    };

    rc.removeLink = function(index)
    {
      if(!rc.form || !rc.form.RecipeLinks) return;

      var pl = rc.form.RecipeLinks[index];
      if(pl)
      {
        rc.form.RecipeLinks.splice(index, 1);
        delete rc.form.RecipeLinks[pl.LinkUrl];
      }
    };

    rc.selectCategory = function(id, clear)
    {
      if(!RecipeService.isLoggedIn()) return;
      if(clear) rc.selectedCategories = {};
      rc.selectedCategories[id] = id;
    };

    rc.isCategorySelected = function(id)
    {
      return !!rc.selectedCategories[id];
    };

    rc.selectedCategoriesArray = function()
    {
      return Object.values(rc.selectedCategories).filter(function(el) { return !!el; });
    };

    rc.selectedCategoryTitles = function()
    {
      var selectedIds = rc.selectedCategoriesArray();
      var titles= [];
      for (var i = 0; i< selectedIds.length; i++)
      {
        var cat = RecipeService.categories[selectedIds[i]]
        titles.push(cat.Name);
      }
      return titles.join(", ");
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

        var words = search.toLowerCase().split(",");
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

    rc.toggleSplit = function(split)
    {
      rc.split = valueOrDefault(split, !rc.split);
      rc.fitImage();
    };

    rc.fitImage = function(delay)
    {
      var delay = valueOrDefault(delay, 0);
      if(rc.slideshow)
        $timeout(function() { rc.slideshow.fitImage() }, delay);
    };

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

      if(!rc.imgConfig.idDir) id="";
      return String.combine(rc.imgConfig.root, rc.imgConfig.dir, recipe.UserID, recipe.ID, subdir, imageUrl);
    };

    rc.firstSentence = function(str)
    {
        return str.substringBefore(".", false, false, true); // || str;
    }

    rc.title = function()
    {
        var defaultTitle = RecipeService.getConfig("defaultTitle");

        var selectedTitles = rc.selectedCategoryTitles();
        if(selectedTitles)
          RecipeService.title = String.append(selectedTitles, " ", "recipes");

        document.title = String.append(RecipeService.title, " - ", defaultTitle);
        return RecipeService.title || defaultTitle; 
    };

    rc.displayProperty = function(key)
    {
        if(!rc.props || !rc.props[key]) return;
        var prop=rc.props[key];

        if(!prop.label) prop.label = String.makeTitle(prop.key);
        return prop.label + ": <b>" + prop.value + "</b>";
    };

    rc.formatProperty = function(obj, key, unit, label)
    {
        if(!obj || !obj[key]) return;
        if(!label) label = String.makeTitle(key);

        var value = obj[key];
        if(!value) return;

        if(unit)
        {
          unit = rc.getUnit(unit);
          value = rc.plural(obj[key], unit.Name || unit, unit.PluralName) 
        }

        if(!rc.props) rc.props = [];
        var prop = {key: key, label: label, value: value};
        rc.props.push(prop);
        rc.props[key] = prop;
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

    rc.rateRecipe = function()
    {
      if(!rc.recipe) return;

//      rc.globalRating = RecipeService.globalRating;
//      rc.userRating = RecipeService.userRating;

      $timeout(function() 
      { 
          rc.userRating.recipeID = rc.recipe.ID;
          RecipeService.postToResource(RecipeService.ratingResource, {action: "SetUserRating" }, rc.userRating, "globalRating", rc);
      }, 0);        
    };

    rc.cancelEdit = function()
    { 
      if(rc.recipe && rc.recipe.ID)
      {
        RecipeService.removeFromCache(rc.recipe.ID); //reload to undo edit changes 
        RecipeService.goToState("recipe", {recipeId: rc.recipe.ID});
      }
      else
        RecipeService.returnToMain();
    };

    rc.init();
}]);
