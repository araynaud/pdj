'use strict';

/* App Module */

// Define new module for our application
var pdjApp = angular.module('pdjApp', ['ui.router', 'ui.bootstrap', 'ngFileUpload', 'pdjControllers', 'pdjServices']);

pdjApp.config(function($stateProvider, $urlRouterProvider)
{  
  $stateProvider
  	.state('list',  { url: "/",                   controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/list.html' })
    .state('about', { url: "/about", controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/article.html' })
    .state('upload',  { url: "/upload/:uploadId",  controller: 'UploadController', controllerAs: 'uc', templateUrl: 'views/upload.html' })
    .state('article', { url: "/article/:articleId", controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/article.html' })
    .state('recipe',  { url: "/recipe/:recipeId",   controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/recipe.html' })
  	.state('signin',  { url: "/signin",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signin.html" })
  	.state('signup',  { url: "/signup",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signup.html" });

  $urlRouterProvider.otherwise("/");
});

angular.module('pdjServices', ['ngResource']);
angular.module('pdjControllers', ['ngSanitize']);
pdjApp.filter('escape', function() { return window.escape; });

pdjApp.toJson = function(data, loop)
{
  if(!data || angular.isString(data)) return data;
  var result = '';
  if(angular.isString(data)) return result + data;

  if(loop && angular.isArray(data))
  {
    data.forEach(function(el)
    {
      result += pdjApp.toJson(el, loop) + '\n';
    });
    return result;
  }

  if(loop && angular.isObject(data))
  {
    for(key in data)
      result += key + ": " + pdjApp.toJson(data[key]) + '\n';
    return result;
  }
  
  return angular.toJson(data, !loop);
};

pdjApp.filter('toJson', function() { return pdjApp.toJson; });
pdjApp.filter('plural', function() { return plural; });