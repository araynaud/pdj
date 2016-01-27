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
        lc.bootstrapSizes = { tn:320, xs:480, sm:768, md:992, lg:1200 };
        $window.addEventListener("load",   lc.getWindowSize);
        $window.addEventListener("resize", lc.getWindowSize);
        
        lc.showDebug = ConfigService.isDebug();
        lc.userAgent = navigator.userAgent.substringAfter(")", true);
        lc.isMobile = ConfigService.isMobile();
        lc.backgroundImage = ConfigService.getConfig("images.background");
        if(lc.backgroundImage)
            lc.backgroundImage = "url({0})".format(lc.backgroundImage);

        ConfigService.user = $window.pdjUser;
        if(!ConfigService.user)   $state.go('signin');

        lc.toggleSidebar(lc.isWider('sm'));
    };

    lc.apply = function(f)
    {
        $scope.$apply(f);
    }

    lc.getWindowSize = function()
    {
        lc.windowWidth  = $window.innerWidth;
        lc.windowHeight = $window.innerHeight;
        $scope.$apply();
    };

    lc.bodyClasses = function()
    {
        var isSmall = lc.isMobile || lc.isSmaller("sm");
        return { isMobile: isSmall, isDesktop: !isSmall, aboveFooter: lc.showDebug };
    }

    lc.sidebarWrapperClasses = function()
    {
        return {"toggled": lc.sidebar} ;
    }

    lc.toggleSidebar = function(st)
    {   
        return lc.sidebar = valueOrDefault(st, !lc.sidebar);
    };

    lc.width = function()
    {
      return lc.windowWidth;
    };

    lc.height = function()
    {
      return lc.windowHeight;
    };

    lc.isPortrait = function()
    {
      return lc.windowWidth <= lc.windowHeight;      
    };

    lc.isWider = function(min)
    {
        if(min && lc.bootstrapSizes[min])
            min = lc.bootstrapSizes[min];
      return $window.innerWidth >= min;      
    };

    lc.isSmaller = function(max)
    {
        if(max && lc.bootstrapSizes[max])
            max = lc.bootstrapSizes[max];
        return $window.innerWidth < max;      
    };

    lc.getBootstrapSize = function()
    {
        var key;
        for(key in lc.bootstrapSizes)
            if($window.innerWidth <= lc.bootstrapSizes[key])
                return key;
        return key;
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
        var defaultTitle = RecipeService.getConfig("defaultTitle");
        return document.title = String.append(RecipeService.title, " / ", defaultTitle);
    };

    lc.init();
}]);
