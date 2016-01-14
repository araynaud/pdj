'use strict';

// =========== LayoutController ===========
angular.module('pdjControllers')
.controller('LayoutController', ['$scope', '$window', '$state', 'ConfigService',
function ($scope, $window, $state, ConfigService)
{
    var lc = this;
    $window.LayoutController = this;
    this.state = $state;

    lc.init = function()
    {
        $window.addEventListener("load",   lc.getWindowSize);
        $window.addEventListener("resize", lc.getWindowSize);
        
        lc.showDebug = ConfigService.isDebug();
        lc.userAgent = navigator.userAgent.substringAfter(")", true);
        lc.isMobile = ConfigService.isMobile();
        lc.backgroundImage = ConfigService.getConfig("images.background");
        if(lc.backgroundImage)
            lc.backgroundImage = "url({0})".format(lc.backgroundImage);

        ConfigService.user = $window.fpUser;
        if(!ConfigService.user)   $state.go('signin');
    }

    lc.getWindowSize = function()
    {
        lc.windowWidth  = $window.innerWidth;
        lc.windowHeight = $window.innerHeight;
        $scope.$apply();
    };

    lc.bodyClasses = function()
    {
        var isSmall = lc.isMobile || $window.innerWidth < 768 ;
        var classes = { isMobile: isSmall, desktop: !isSmall  };        
        return classes;
    }

    lc.width = function()
    {
      return $window.innerWidth;
    };

    lc.height = function()
    {
      return $window.innerHeight;
    };

    lc.isPortrait = function()
    {
      return $window.innerWidth <= $window.innerHeight;      
    };

    lc.isWider = function(min)
    {
      return $window.innerWidth >= min;      
    };

    lc.userFullName = function()
    {
      return ConfigService.userFullName();
    };

    lc.loggedIn = function()
    {
      return !!ConfigService.user;
    };

    lc.logout = function()
    {
        return ConfigService.logout();
    }

    lc.stateIs = function(st)
    {
        return $state.is(st);
    };

    lc.currentState = function()
    {
        return $state.current.name;
    };

    lc.title = function()
    {
      document.title = ConfigService.title ? ConfigService.title + " - " + lc.config.defaultTitle : lc.config.defaultTitle;
      return ConfigService.title || lc.config.defaultTitle;
    };

    lc.init();
}]);
