'use strict';

angular.module('pdjServices')
.service('ConfigService', ['$http', '$resource', '$state', '$q', function($http, $resource, $state, $q) 
{
    var svc = this;
    window.ConfigService = this;
    this.init = function()
    {
        this.state = $state;
        this.config = window.pdjConfig;        
        this.offline = this.isOffline();
        this.loginResource = this.getResource("pdj", "Account/:action");
        this.phpLoginResource = $resource("api/login.php");
    };

    this.getConfig = function(key)
    {
        return valueIfDefined(key, svc.config);
    }

    this.getResourceUrl = function(api, url, qs)
    {
        if(this.offline)
        {
            var svcName = url.substringBefore("/:")
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

    this.getResource = function(api, url, qs, defaults)
    {
        url = this.getResourceUrl(api, url, qs);
        return $resource(url, defaults);
    };

//go to default page if not logged in
    this.requireLogin = function()
    {
        if(!svc.user && !svc.isOffline())
            $state.go('list');
    };

    this.stateIs = function(st)
    {
        return $state.is(st);
    };

    this.currentState = function()
    {
        return $state.current.name;
    };

    this.goToState = function(st, params)
    {
        $state.go(st, params); 
    };

    this.returnToMain = function(delay)
    {
        if(!delay)
            $state.go('list');
        else
            $timeout(function() { $state.go('list'); }, delay);
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
        svc.loginResource.save({action: "SignOut"}, {});
        svc.phpLoginResource.save({action: "SignOut"});
    }
    
    //POST to login.php service
    this.login = function(method, postData)
    {
        var deferred = $q.defer();
        //formData.action = "login"; //or register or logout
        this.loginResource.save({action: method}, postData, function(response) 
        {
            if(response.State === "ERROR") 
            {
                svc.logout();
                deferred.resolve(response);
                return;
            }

            svc.user = response.Data;
            if(!svc.user)
                svc.user = { username: postData.username };

            svc.phpLoginResource.save(svc.user);
            deferred.resolve(svc.user);
        },
        function(error)
        {
            svc.logout();
            deferred.resolve(error.data);
        });
        return deferred.promise;
    };

    this.currentUsername = function()
    {
        return this.user ? this.user.Username : null;
    };

    this.userFullName = function()
    {
        if(!this.user) return "nobody";
        if(!this.user.FirstName && !this.user.LastName)   return this.user.Username;
        return String.append(this.user.FirstName, " ", this.user.LastName);
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
