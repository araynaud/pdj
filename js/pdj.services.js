'use strict';

angular.module('pdjServices')
.service('RecipeService', ['$resource', '$q', function($resource, $q) 
{
	this._album=null;
    var pdjService = this;
    window.recipeService = this;
    this.config = pdjConfig || {};
    this.pdjApiBaseUrl = this.config.pdjApi.root;
    if(this.config.pdjApi.proxy)
        this.pdjApiBaseUrl = String.combine(this.config.pdjApi.proxy, this.config.pdjApi.root);
    this.pdjApiBaseUrl += "/";

    this.articles={};
    this.recipes={};
    this.recipeCategories={};
    this.categoryTypes=[];
    this.categoryTypeNames={};
    this.categoryNames={};
    this.mode = "";

$resource(this.pdjApiBaseUrl + 'Categories/GetAllCategoryTypes',
    {}, { query: {method:'GET', isArray:true} });

    if(valueIfDefined("config.debug.offline",this))
    {
        this.listResource = $resource('json/GetRecipeBrowseDetails.json');
        this.articleResource = $resource('json/GetAboutArticle.json');
        this.recipeResource = $resource('json/GetRecipeDetails.json');
        this.categoryTypeResource = $resource('json/GetAllCategoriesWithDetails.json');
    }else
    {
        this.listResource = $resource(this.pdjApiBaseUrl + 'Recipes/GetRecipeBrowseDetails?searchText=:search:categories');
        this.articleResource = $resource(this.pdjApiBaseUrl + 'Articles/:article');
        this.recipeResource = $resource(this.pdjApiBaseUrl + 'Recipes/GetRecipeDetails?recipeId=:id');
        this.categoryTypeResource = $resource(this.pdjApiBaseUrl + 'Categories/GetAllCategoriesWithDetails');
    }

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
                pdjService.categoryTypeNames[type.ID]=type.Name;
                for(var j=0; j<type.Categories.length; j++)
                {
                    var cat=type.Categories[j];
                    pdjService.categoryNames[cat.ID]=cat.Name;
                }                
            }
            deferred.resolve(response.Data);
        });
        return deferred.promise;
    }

	this.getList = function(search, categories)
	{
        this.mode="list";
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

        this.mode="article";

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
        this.mode="recipe";

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

}]);
