'use strict';

// App Module: Define new module for our application
var app = angular.module('app', ['ui.router', 'ui.bootstrap', 'ngFileUpload', 'pdjControllers', 'pdjServices']);

app.config(function($stateProvider, $urlRouterProvider)
{  
  $stateProvider
  	.state('list',    { url: "/",                     controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/list.html' })
    .state('about',   { url: "/about",                controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/article.html' })
    .state('article', { url: "/article/:articleId",   controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/article.html' })
    .state('recipe',  { url: "/recipe/:recipeId",     controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/recipe.html', params: {'recipeId':null} })
    .state('submit',  { url: "/recipeedit",           controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/recipeEdit.html' })
    .state('edit',    { url: "/recipeedit/:recipeId", controller: 'RecipeController', controllerAs: 'rc', templateUrl: 'views/recipeEdit.html' })
    .state('upload',  { url: "/upload/:uploadId",     controller: 'UploadController', controllerAs: 'uc', templateUrl: 'views/upload.html' })
  	.state('signin',  { url: "/signin",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signin.html" })
  	.state('signup',  { url: "/signup",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signup.html" });

  $urlRouterProvider.otherwise("/");
});

angular.module('pdjServices', ['ngResource']);
angular.module('pdjControllers', ['ngSanitize']);

app.isMobile = function() 
{ 
    return !!navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Phone|mobile/i);
};

app.toJson = function(data, loop)
{
  if(!data || angular.isString(data)) return data;
  var result = '';
  if(angular.isString(data)) return result + data;

  if(loop && angular.isArray(data))
  {
    data.forEach(function(el)
    {
      result += app.toJson(el, loop) + '\n';
    });
    return result;
  }

  if(loop && angular.isObject(data))
  {
    for(var key in data)
      result += key + ": " + app.toJson(data[key]) + '\n';
    return result;
  }
  
  return angular.toJson(data, !loop);
};

app.filter('toJson', function() { return app.toJson; });
app.filter('plural', function() { return window.plural; });
app.filter('escape', function() { return window.escape; });
