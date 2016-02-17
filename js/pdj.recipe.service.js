'use strict';

angular.module('pdjServices')
.service('RecipeService', ['$resource', '$q', 'ConfigService',  function($resource, $q, ConfigService) 
{
    var svc = this;
    window.RecipeService = this;
    this.articles={};
    this.recipes={};
    this.categoryTypes=[];
    this.categoryTypeNames={};
    this.categoryNames={};
    this.categories = {};

    this.getConfig    = ConfigService.getConfig;
    this.stateIs      = ConfigService.stateIs;
    this.goToState    = ConfigService.goToState;
    this.currentState = ConfigService.currentState;
    this.returnToMain = ConfigService.returnToMain;

    //REST Services
    this.categoryTypeResource = ConfigService.getResource("pdj", "Category/GetAllCategoriesWithDetails");
    this.articleResource =      ConfigService.getResource("pdj", "Article/:article");
    this.listResource =         ConfigService.getResource("pdj", "Recipe/GetRecipeList", "searchText=:search:categories");
    this.recipeResource =       ConfigService.getResource("pdj", "Recipe/GetRecipeDetails", "recipeId=:id");
    this.recipeSaveResource =   ConfigService.getResource("pdj", "Recipe/ImportRawTextRecipe");


    this.loadUnits = function(obj)
    {
        if(!obj) obj = svc;
        return ConfigService.loadCsv("api/units.csv", "units", obj);
    };

    this.getCategoryTypes = function()
    {
        if(!isEmpty(this.categoryTypes))
            return this.categoryTypes;

        var deferred = $q.defer();
        this.categoryTypeResource.get({ }, function(response)
        {
            svc.categoryTypes = response.Data;
            for(var i=0; i<svc.categoryTypes.length; i++)
            {
                var type = svc.categoryTypes[i];
                svc.categoryTypeNames[type.ID] = type.Name;
                if(!type.Categories) continue;
                for(var j=0; j<type.Categories.length; j++)
                {
                    var cat = type.Categories[j];
                    cat.typeId = type.ID;
                    cat.type = type.Name;
                    svc.categoryNames[cat.ID] = cat.Name;
                    svc.categories[cat.ID] = cat;
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

    this.getCategoriesQS = function(categories)
    {
        var qs="";
        for(var i=0; i<categories.length; i++)
            qs+="&categoryIDs[{0}]={1}".format(i, categories[i]);
        return qs;
    };

    this.refreshRecipeCategories = function(recipe)
    {
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


    this.getArticle = function(article)
    {
        if(!article) article = 'GetAboutArticle';

        if(svc.articles[article])
        {
            svc.title = svc.articles[article].title;
            return svc.articles[article];
        }

        var deferred = $q.defer();
        this.articleResource.get({ article: article }, function(response)
        {
            response.Data.Text = response.Data.Text.replace(/\.  /g, '.\n');
            response.Data.Text = response.Data.Text.replace(/! /g, '!\n');
            if(!response.Data.title)
                response.Data.title = response.Data.Text.substringBefore("!").substringBefore(".");

            svc.articles[article] = response.Data;
            svc.currentArticle = response.Data;
            svc.title = response.Data.title;

            deferred.resolve(response.Data);
        });
        return deferred.promise;
    };

    this.getRecipe = function(id)
    {
        if(svc.recipes[id])
        {
            svc.title = svc.recipes[id].Name;
            return svc.recipes[id];
        }

        var deferred = $q.defer();
        this.recipeResource.get({ id: id }, function(response)
        {
            if(svc.isError(response))
                deferred.resolve(response);
            else
            {               
                svc.recipes[id] = response.Data;
                svc.currentRecipe = response.Data;
                svc.currentRecipe.categories = svc.getRecipeCategories(svc.currentRecipe.CategoryIDs);
                svc.title = svc.currentRecipe.Name;
                deferred.resolve(svc.currentRecipe);
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
                //svc.recipes[id] = svc.currentRecipe = {Recipe : recipe};
                svc.title = recipe.Name;
            }
            deferred.resolve(response);
        });
        return deferred.promise;
    };


    this.isSuccess = function(response)
    {
        return response.State == "SUCCESS";
    };

    this.isError = function(response)
    {
        return response.State == "ERROR";
    };


}]);
