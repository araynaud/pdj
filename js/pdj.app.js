'use strict';

/* App Module */

// Define new module for our application
var pdjApp = angular.module('pdjApp', ['ngRoute', 'pdjControllers', 'pdjServices']);

pdjApp.config(['$routeProvider', function($routeProvider)
{
  $routeProvider
  .when('/recipe/:recipeId', { templateUrl: 'partials/recipe.html', controller: 'RecipeController'})
  .when('/article/:articleId', { templateUrl: 'partials/article.html', controller: 'RecipeController'})
  .when('/about', { redirectTo: '/article/GetAboutArticle'})
  .when('/search/:search', { templateUrl: 'partials/list.html', controller: 'RecipeController'})
  .otherwise({ templateUrl: 'partials/list.html', controller: 'RecipeController' })
}]);

pdjApp.filter('escape', function() { return window.escape; });