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

/*
pdjApp.config(function($stateProvider, $urlRouterProvider)
{  
  // For any unmatched url, send to /route1
  $urlRouterProvider.otherwise("/");
  $stateProvider
  	.state('home',    { url: "/",        templateUrl: 'views/about.html' })
    .state('main',    { url: "/main",    controller: 'MainController',   controllerAs: 'mc', templateUrl: 'views/main.html' })
    .state('upload',  { url: "/upload/:uploadId",  controller: 'UploadController', controllerAs: 'uc', templateUrl: 'views/upload.html' })
  	.state('signin',  { url: "/signin",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signin.html" })
  	.state('signup',  { url: "/signup",  controller: 'LoginController',  controllerAs: 'lc', templateUrl: "views/signup.html" })
  	.state('profile', { url: "/profile",
  		controller: 'ProfileController', controllerAs: 'pc', 
  		template: '<object-form actions="pc.actions" questions="pc.questions" form-data="pc.formData" showDebug="pc.showDebug"/>'});
});
*/

angular.module('pdjServices', ['ngResource']);
angular.module('pdjControllers', ['ngSanitize']);
pdjApp.filter('escape', function() { return window.escape; });

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
    for(key in data)
      result += key + ": " + app.toJson(data[key]) + '\n';
    return result;
  }
  
  return angular.toJson(data, !loop);
};

// In the return function, we must pass in a single parameter which will be the data we will work on.
// We have the ability to support multiple other parameters that can be passed into the filter optionally
app.filter('toJson', function() { return app.toJson; });