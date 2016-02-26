'use strict';

angular.module('pdjServices')
.service('RecipeService', ['$resource', '$q', 'ConfigService',  function($resource, $q, ConfigService) 
{
    var svc = this;
    window.RecipeService = this;
    this.articles={};
    this.recipes={};

    this.getConfig    = ConfigService.getConfig;
    this.stateIs      = ConfigService.stateIs;
    this.goToState    = ConfigService.goToState;
    this.currentState = ConfigService.currentState;
    this.returnToMain = ConfigService.returnToMain;
    this.isMine       = ConfigService.isMine;
    this.loadLinkMetadata = ConfigService.loadLinkMetadata;

    //REST Services
    this.categoryTypeResource = ConfigService.getResource("pdj", "Category/GetAllCategoriesWithDetails");
    this.articleResource =      ConfigService.getResource("pdj", "Article/:article");
    this.listResource =         ConfigService.getResource("pdj", "Recipe/GetRecipeList", "searchText=:search:categories");
    this.recipeResource =       ConfigService.getResource("pdj", "Recipe/GetRecipeDetails", "recipeId=:id");
    this.recipeSaveResource =   ConfigService.getResource("pdj", "Recipe/SaveRecipe");

//Data load functions
    this.loadUnits = function(obj)
    {
        if(!obj) obj = svc;
        return ConfigService.loadCsv("api/units.csv", "units", obj);
    };

    this.loadCategoryTypes = function()
    {
        var deferred = $q.defer();

        if(!isEmpty(svc.categoryTypes))
            deferred.resolve(svc.categoryTypes);
        else
            this.categoryTypeResource.get({ }, function(response)
            {
                svc.categoryTypes = response.Data;
                svc.categories = {};
                for(var i=0; i<svc.categoryTypes.length; i++)
                {
                    var type = svc.categoryTypes[i];
                    if(!type.Categories) continue;
                    for(var j=0; j<type.Categories.length; j++)
                    {
                        var cat = type.Categories[j];
                        cat.typeId = type.ID;
                        cat.type = type.Name;
                        svc.categories[cat.ID] = cat;
                    }                
                    type.Categories.sortObjectsBy("Name");
                }

                svc.categoriesByName = Object.indexBy(svc.categories, svc.nameLower);
                svc.categoriesByTag  = Object.indexBy(svc.categories, svc.nameToHashtag);

                deferred.resolve(svc.categoryTypes);
            });
        return deferred.promise;
    }

    this.nameLower = function(c)
    {
        return c.Name.toLowerCase().replace("'", "").replace(".", "");
    };

    this.nameToHashtag = function(c)
    {
        return "#" + c.Name.replace(" ", "").replace(".", "").replace("'", "");
    };

	this.loadRecipeList = function(search, categories)
	{
        var catqs = this.getCategoriesQS(categories);
        var deferred = $q.defer();
	    this.listResource.get({ search: search, categories: catqs }, function(response)
        {
            svc.title = "";
            svc.currentList = response.Data;

            for(var i=0; i < svc.currentList.length; i++)
            {
                var recipe = response.Data[i];
                svc.refreshRecipeCategories(recipe);
            };
            deferred.resolve(response.Data);
        });
 		return deferred.promise;
	};

    this.loadArticle = function(id)
    {
        if(!id) id = 'GetAboutArticle';

        var deferred = $q.defer();
        if(svc.articles[id])
        {
            svc.title = svc.articles[id].title;
            deferred.resolve(svc.articles[id]);
        }
        else
            svc.articleResource.get({ article: id }, function(response)
            {
                response.Data.Text = response.Data.Text.replace(/\.  /g, '.\n');
                response.Data.Text = response.Data.Text.replace(/! /g, '!\n');
                if(!response.Data.title)
                    response.Data.title = response.Data.Text.substringBefore("!").substringBefore(".");

                svc.articles[id] = response.Data;
                svc.currentArticle = response.Data;
                svc.title = response.Data.title;

                deferred.resolve(response.Data);
            });
        return deferred.promise;
    };

    this.loadRecipe = function(id)
    {
        var deferred = $q.defer();
        if(svc.recipes[id])
        {
            svc.recipe = svc.recipes[id]; 
            svc.title = svc.recipe.Name;
            deferred.resolve(svc.recipe);
        }
        else
            this.recipeResource.get({ id: id }, function(response)
            {
                if(svc.isError(response))
                    deferred.resolve(response);
                else
                {               
                    svc.addToCache(response.Data);
                    svc.refreshRecipeCategories(svc.recipe);
                    svc.title = svc.recipe.Name;
                    deferred.resolve(svc.recipe);
                }
            });
        return deferred.promise;
    };

    this.saveRecipe = function(recipe)
    {
        var deferred = $q.defer();
        if(ConfigService.isOffline())
        {
            deferred.resolve({Data: 1});
            return deferred.promise;
        }

        this.recipeSaveResource.save({  }, recipe, function(response)
        {
            var id = response.Data;
            if(id && response.State == "SUCCESS")
            {
                recipe.ID = id;
                svc.removeFromCache(id);
                svc.title = recipe.Name;
            }
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    this.addToCache = function(recipe)
    {
        svc.recipes[recipe.ID] = svc.recipe = recipe;
        return recipe;
    };

    this.removeFromCache = function(id)
    {
        delete svc.recipes[id];
    };


    this.getCategoriesQS = function(categories)
    {
        var qs="";
        for(var i=0; i<categories.length; i++)
            qs+="&categoryIDs[{0}]={1}".format(i, categories[i]);
        return qs;
    };

    this.refreshRecipeCategories = function(recipe)
    {
        if(isEmpty(svc.categoryTypes)) return;
        recipe.tags = svc.getRecipeTags(recipe.CategoryIDs);
        return recipe.categories = svc.getRecipeCategories(recipe.CategoryIDs);
    };

    this.getRecipeCategories = function(ids)
    {
        var cats = [];
        if(!ids) return cats;
        
        for(var i=0; i<ids.length; i++)
            cats.push(svc.categories[ids[i]]);

        cats = Object.toArray(cats.groupBy("type")).sortObjectsBy("key");
        for(var i=0; i<cats.length; i++)
        {
            var catType = cats[i];
            catType.allNames = catType.value.distinct("Name").join(", ");
            catType.names = catType.value.distinct("Name", true, ["Any", "Other", "Unknown"]).join(", ");
        }
        return cats;
    };

    this.getRecipeTags = function(ids)
    {
        var cats = [];
        if(!ids) return "";
        
        for(var i=0; i<ids.length; i++)
            cats.push(svc.categories[ids[i]]);

        var tags = cats.distinct("Name", true, ["Any", "Other", "Unknown"]);
        return tags;
    }

    this.getRecipeHashtags = function(ids)
    {
        var cats = [];
        if(!ids) return "";
        
        for(var i=0; i<ids.length; i++)
            cats.push(svc.categories[ids[i]]);

        var tags = cats.distinct(svc.nameToHashtag, true, ["#Any", "#Other", "#Unknown"]);
        return tags;
    }

    this.isSuccess = function(response)
    {
        return response.State == "SUCCESS";
    };

    this.isError = function(response)
    {
        return response.State == "ERROR";
    };


}]);
