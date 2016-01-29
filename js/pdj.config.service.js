'use strict';

angular.module('pdjServices', ['ngResource'])
.service('ConfigService', ['$http', '$resource', '$state', '$q', function($http, $resource, $state, $q) 
{
    var svc = this;
    window.ConfigService = this;
    this.init = function()
    {
        this.config = window.pdjConfig;        
        this.offline = this.isOffline();
        this.loginResource = this.getResource("pdj", "Account/SignIn");
        this.phpLoginResource = $resource("api/login.php");
    };

    this.getConfig = function(key)
    {
        return valueIfDefined(key, svc.config);
    }

    this.getResourceUrl = function(api, url, qs, offline)
    {
        if(offline)
        {
            var svcName = service.substringBefore("/:")
            svcName = svcName.substringAfter("/", false, true);
            return "json/" + svcName + ".json";
        }

        var baseUrl = this.getConfig("api."+api+".url");
        var isExternal = baseUrl &&  (baseUrl.startsWith("//") || baseUrl.containsText("://"));
        var proxy = isExternal ? this.getConfig("api.proxy") : null;
        var url = String.combine(proxy, baseUrl, url);
        if(qs) url+= "?" + qs;
        return url;
    };

    this.getResource = function(api, url, qs)
    {
        url = this.getResourceUrl(api, url, qs, this.offline);
        return $resource(url);
    };

//go to default page if not logged in
    this.requireLogin = function()
    {
        if(!svc.user && !svc.isOffline())
            $state.go('list');
    };

    this.isDebug = function()
    {
        return !!svc.getConfig('debug.angular');
    };
    
    this.isOffline = function()
    {
        return !!svc.getConfig('debug.offline');
    };

    this.serviceExt = function()
    {
        return svc.isOffline() ? '.json' : '.php';
    };

//User login / logout
//POST to login.php service
    this.logout = function()
    {
        svc.user = null;
        svc.phpLoginResource.save({action: "logout"});
    }
    
    //POST to login.php service
    this.login = function(postData)
    {
        var deferred = $q.defer();
        //formData.action = "login"; //or register or logout
        this.loginResource.save(postData, function(response) 
        {
            if(response.$resolved === true)
                svc.user = { username: postData.username };
            else if(response.$resolved.user)
                svc.user = response.$resolved.user;
            else
                svc.user = null;

            svc.phpLoginResource.save(svc.user);
            deferred.resolve(svc.user);
        },
        function(error)
        {
            svc.logout();
//            deferred.resolve(null);
            deferred.resolve(error.data);
        });
        return deferred.promise;
    };

    this.currentUsername = function()
    {
        return this.user ? this.user.username : null;
    };

    this.userFullName = function()
    {
        if(!this.user) return "nobody";
        if(!this.user.first_name && !this.user.last_name)   return this.user.username;
        if(!this.user.first_name)   return this.user.last_name;
        if(!this.user.last_name)    return this.user.first_name;
        return this.user.first_name + " " + this.user.last_name;
    };

    this.isMobile = function() 
    { 
        return !!navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Phone|mobile/i);
    }

    this.clientIs = function(str) 
    { 
        var reg = new RegExp(str, "i");
        return !!navigator.userAgent.match(reg);
    }

    this.clientIsIE = function() 
    { 
        return this.clientIs("MSIE|Trident");
    }

    this.init();
}]);
