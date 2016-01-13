'use strict';

angular.module('pdjServices', ['ngResource'])
.service('ConfigService', ['$http', '$resource', '$q', function($http, $resource, $q) 
{
    var service = this;
    window.ConfigService = this;
    this.init = function()
    {
        this.config = window.pdjConfig;

        this.configResource = $resource('api/config.php');
        this.loginResource = $resource('api/login' + this.serviceExt());
    };

    this.isDebug = function()
    {
        return valueIfDefined('config.debug.angular', service);
    };
    
    this.isOffline = function()
    {
        return valueIfDefined('config.debug.offline', service);
    };

    this.serviceExt = function()
    {
        return this.isOffline() ? '.json' : '.php';
    };

    this.loadConfig = function()
    {
        var deferred = $q.defer();
        this.configResource.get(function(response)
        {
            service.config = response;
            deferred.resolve(response);
        });
        return deferred.promise;
    };

//User login / logout
//POST to login.php service
    this.logout = function()
    {
        return this.login({action: "logout"});    
    }
    
    //POST to login.php service
    this.login = function(formData)
    {
        var deferred = $q.defer();
        //formData.action = "login"; //or register or logout
        this.loginResource.save(formData, function(response) 
        {
            service.user = response.user;
            deferred.resolve(response);
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
