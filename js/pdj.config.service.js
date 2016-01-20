'use strict';

angular.module('pdjServices', ['ngResource'])
.service('ConfigService', ['$http', '$resource', '$q', function($http, $resource, $q) 
{
    var service = this;
    window.ConfigService = this;
    this.init = function()
    {
        this.config = window.pdjConfig;        
        this.offline = this.isOffline();
        this.loginResource = this.getResource("Accounts/SignIn");
    };

    this.getConfig = function(key)
    {
        return valueIfDefined(key, service.config);
    }

    this.getResourceUrl = function(service, qs, offline)
    {
        if(offline)
        {
            var svc = service.substringBefore("/:")
            svc = svc.substringAfter("/", false, true);
            return "json/" + svc + ".json";
        }
        var url = String.combine(this.config.pdjApi.proxy, this.config.pdjApi.root, service);
        if(qs) url+= "?" + qs;
        return url;
    };

    this.getResource = function(url, qs)
    {
        var url = this.getResourceUrl(url, qs, this.offline);
        return $resource(url);
    }

    this.isDebug = function()
    {
        return !!service.getConfig('debug.angular');
    };
    
    this.isOffline = function()
    {
        return !!service.getConfig('debug.offline');
    };

    this.serviceExt = function()
    {
        return service.isOffline() ? '.json' : '.php';
    };

//User login / logout
//POST to login.php service
    this.logout = function()
    {
        return this.login({action: "logout"});    
    }
    
    //POST to login.php service
    this.login = function(postData)
    {
        var deferred = $q.defer();
        //formData.action = "login"; //or register or logout
        this.loginResource.save(postData, function(response) 
        {
            service.user = null;
            if(response.$resolved === true)
                service.user = { username: postData.username };
            else if(response.$resolved.user)
                service.user = response.$resolved.user;
            deferred.resolve(service.user);
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
