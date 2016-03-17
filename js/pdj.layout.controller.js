'use strict';

// =========== LayoutController ===========
angular.module('pdjControllers')
.controller('LayoutController', ['$scope', '$window', 'ConfigService', 'RecipeService',
function ($scope, $window, ConfigService, RecipeService)
{
    var lc = this;
    $window.LayoutController = this;

    lc.init = function()
    {
        lc.bootstrapSizes = ConfigService.getConfig("lib.bootstrap.sizes");
        $window.addEventListener("load",   lc.getWindowSize);
        $window.addEventListener("resize", lc.getWindowSize);
        
        lc.showDebug = ConfigService.isDebug();
        lc.userAgent = navigator.userAgent.substringAfter(")", true);
        lc.isMobile = ConfigService.isMobile();

        lc.backgroundImage = ConfigService.getConfig("images.background");
        if(lc.backgroundImage)
        {
            lc.backgroundImage = "url({0})".format(lc.backgroundImage);
            lc.backgroundImage = { 'background-image': lc.backgroundImage, 'z-index': -30 }
        }

        lc.overlay = lc.overlayStyle();

        lc.footer = ConfigService.getConfig("footer");
        if(lc.footer && lc.footer.copyright)
            lc.footer.copyright = new Date().getFullYear() + " " + lc.footer.copyright;

        
        lc.toggleSidebar(lc.isWider('sm'));
    };

    lc.apply = function(f)
    {
        $scope.$apply(f);
    };

    lc.getWindowSize = function()
    {
        lc.windowWidth  = $window.innerWidth;
        lc.windowHeight = $window.innerHeight;
        $scope.$apply();
    };

    lc.bodyClasses = function()
    {
        var isSmall = lc.isMobile || lc.isSmaller("sm");
        return { isMobile: isSmall, isDesktop: !isSmall, aboveFooter: true };
    };

    lc.overlayStyle = function()
    {
        var overlayColor = ConfigService.getConfig("images.overlay");
        if(!overlayColor) return;

        if(angular.isArray(overlayColor))
        {
            var prefix = "rgb";
            if(overlayColor.length == 4) prefix="rgba";
            overlayColor = "{0}({1})".format(prefix, overlayColor.join(","));
        }

        return { "background-color": overlayColor };
    };

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

    lc.title = function()
    {
        var defaultTitle = ConfigService.getConfig("defaultTitle");
        return document.title = String.append(RecipeService.title, " - ", defaultTitle);
    };

    lc.shortTitle = function()
    {
        var defaultTitle = RecipeService.getConfig("defaultTitle");
        return RecipeService.title || defaultTitle; 
    };

//functions from ConfigService
    lc.userFullName = ConfigService.userFullName;
    lc.loggedIn = ConfigService.loggedIn;
    lc.isAdmin = ConfigService.isAdmin;
    lc.logout = ConfigService.logout;
    lc.stateIs = ConfigService.stateIs;
    lc.currentState = ConfigService.currentState;

    lc.init();
}]);
