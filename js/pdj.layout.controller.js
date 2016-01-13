'use strict';

// =========== LayoutController ===========
angular.module('pdjControllers').
controller('LayoutController', ['$scope', '$window', 'RecipeService', 
function ($scope, $window, RecipeService)
{
    $scope.config = $window.pdjConfig;
    if($scope.config.images.background)
        $scope.backgroundImage = "url({0})".format($scope.config.images.background);

    $scope.getWindowSize = function()
    {
        $scope.windowWidth  = $window.innerWidth;
        $scope.windowHeight = $window.innerHeight;
        $scope.$apply();
    };

    $window.addEventListener("load",   $scope.getWindowSize);
    $window.addEventListener("resize", $scope.getWindowSize);

    $scope.width = function()
    {
      return $window.innerWidth;
    };

    $scope.isPortrait = function()
    {
      return $window.innerWidth <= $window.innerHeight;      
    };

    $scope.isWider = function(min)
    {
      return $window.innerWidth >= min;      
    };

    $scope.title = function()
    {
      document.title = RecipeService.title ? RecipeService.title + " - " + $scope.config.defaultTitle : $scope.config.defaultTitle;
      return RecipeService.title || $scope.config.defaultTitle;
    };

    $scope.mode = function()
    {
      return RecipeService.mode;
    };

    $scope.userAgent = navigator.userAgent;

}]); 
