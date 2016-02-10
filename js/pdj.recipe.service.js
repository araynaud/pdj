'use strict';

angular.module('pdjServices')
.service('RecipeService', ['$resource', '$q', 'ConfigService',  function($resource, $q, ConfigService) 
{
    var pdjService = this;
    window.RecipeService = this;
    this.articles={};
    this.recipes={};
    this.recipeCategories={};
    this.categoryTypes=[];
    this.categoryTypeNames={};
    this.categoryNames={};

    this.getConfig    = ConfigService.getConfig;
    this.stateIs      = ConfigService.stateIs;
    this.goToState    = ConfigService.goToState;
    this.currentState = ConfigService.currentState;
    this.returnToMain = ConfigService.returnToMain;

    //REST Services
    this.categoryTypeResource = ConfigService.getResource("pdj", "Category/GetAllCategoriesWithDetails");
    this.articleResource =      ConfigService.getResource("pdj", "Article/:article");
    this.listResource =         ConfigService.getResource("pdj", "Recipe/GetRecipeBrowseDetails", "searchText=:search:categories");
    this.recipeResource =       ConfigService.getResource("pdj", "Recipe/GetRecipeDetails", "recipeId=:id");
    this.recipeSaveResource =   ConfigService.getResource("pdj", "Recipe/ImportRawTextRecipe");


    this.loadUnits = function(obj)
    {
        if(!obj) obj = pdjService;
        return ConfigService.loadCsv("api/units.csv", "units", obj);
    };

    this.getCategoryTypes = function()
    {
        if(!isEmpty(this.categoryTypes))
            return this.categoryTypes;

        var deferred = $q.defer();
        this.categoryTypeResource.get({ }, function(response)
        {
            pdjService.categoryTypes = response.Data;
            for(var i=0; i<response.Data.length; i++)
            {
                var type = pdjService.categoryTypes[i];
                pdjService.categoryTypeNames[type.ID] = type.Name;
                if(!type.Categories) continue;
                for(var j=0; j<type.Categories.length; j++)
                {
                    var cat=type.Categories[j];
                    pdjService.categoryNames[cat.ID] = cat.Name;
                }                
                type.Categories.sortObjectsBy("Name");
            }
            deferred.resolve(response.Data);
        });
        return deferred.promise;
    }

	this.getList = function(search, categories)
	{
        var catqs = this.getCategoriesQS(categories);
        var deferred = $q.defer();
	    this.listResource.get({ search: search, categories: catqs }, function(response)
        {
            pdjService.title = "";
            pdjService.currentList = response.Data;

            for(var i=0; i<response.Data.length; i++)
            {
                var recipe = response.Data[i];
                pdjService.recipeCategories[recipe.RecipeID] = recipe.RecipeCategories;
            };
window.recipeCategories = pdjService.recipeCategories;
            deferred.resolve(response.Data);
        });
 		return deferred.promise;
	};

    this.getCategoriesQS = function(categories)
    {
        var qs="";
        for(var i=0; i<categories.length; i++)
            qs+="&categoryIDs[{0}]={1}".format(i, categories[i]);
        return qs;
    };

    this.getArticle = function(article)
    {
        if(!article) article = 'GetAboutArticle';

        if(pdjService.articles[article])
        {
            pdjService.title = pdjService.articles[article].title;
            return pdjService.articles[article];
        }

        var deferred = $q.defer();
        this.articleResource.get({ article: article }, function(response)
        {
            response.Data.Text = response.Data.Text.replace(/\.  /g, '.\n');
            response.Data.Text = response.Data.Text.replace(/! /g, '!\n');
            if(!response.Data.title)
                response.Data.title = response.Data.Text.substringBefore("!").substringBefore(".");

            pdjService.articles[article] = response.Data;
            pdjService.currentArticle = response.Data;
            pdjService.title = response.Data.title;

            deferred.resolve(response.Data);
        });
        return deferred.promise;
    };

    this.getRecipe = function(id)
    {
        if(pdjService.recipes[id])
        {
            pdjService.title = pdjService.recipes[id].Recipe.Name;
            return pdjService.recipes[id];
        }

        var deferred = $q.defer();
        this.recipeResource.get({ id: id  }, function(response)
        {
            pdjService.recipes[id] = response.Data;
            pdjService.currentRecipe = response.Data;

            if(!pdjService.currentRecipe.RecipeCategories && pdjService.recipeCategories[id])
                pdjService.currentRecipe.RecipeCategories = pdjService.recipeCategories[id];

            pdjService.title = response.Data.Recipe.Name;
            deferred.resolve(response.Data);
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
                //pdjService.recipes[id] = pdjService.currentRecipe = {Recipe : recipe};
                pdjService.title = recipe.Name;
            }
            deferred.resolve(response);
        });
        return deferred.promise;
    };

}]);
