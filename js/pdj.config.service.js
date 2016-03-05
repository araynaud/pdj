'use strict';

angular.module('pdjServices')
.service('ConfigService', ['$http', '$resource', '$state', '$q', '$timeout' , function($http, $resource, $state, $q, $timeout) 
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
        this.linkResource = $resource("api/link.php/:url");
        this.user = window.pdjUser;
        this.getCurrentUser();
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
        var proxy = String.isExternalUrl(baseUrl) ? this.getConfig("api.proxy") : null;
        var url = String.combine(proxy, baseUrl, url);
        if(qs) url += "?" + qs;
        return url;
    };

    this.getResource = function(api, url, qs, defaults)
    {
        url = this.getResourceUrl(api, url, qs);
        return $resource(url, defaults);
    };

    this.loadCsv = function(url, key, obj)
    {
        var deferred = $q.defer();
        if(!obj) obj = this;

        if(obj[key])
            deferred.resolve(obj[key]);
        else
            $http.get(url).then(function(response) 
            {
                var data = String.parseCsv(response.data, true);
                if(key)
                    obj[key] = data;
                deferred.resolve(data);
            });
        return deferred.promise;
    };

//go to default page if not logged in
    this.requireLogin = function()
    {
        this.getCurrentUser().then(function()
        {
            if(!svc.user && !svc.isOffline())
                $state.go('list');
        });
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

    this.loadLinkMetadata = function(url)
    {
        var deferred = $q.defer();
        svc.linkResource.get({url:url}, {}, function(response)
        {
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    this.logout = function()
    {
        svc.user = null;
        svc.loginResource.save({action: "SignOut"}, {}, function()
        {
            svc.phpLoginResource.save({action: "SignOut"});
        });
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

    this.getCurrentUser = function()
    {
        var deferred = $q.defer();
        //formData.action = "login"; //or register or logout
        this.loginResource.get({action: "GetCurrentUser"}, function(response) 
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

    this.loggedIn = function()
    {
      return !!svc.user;
    };

    this.isAdmin = function()
    {
        return svc.user && svc.user.IsAdmin;
    };

    this.currentUsername = function()
    {
        return svc.user ? svc.user.Username : null;
    };

    this.currentUserId = function()
    {
        return svc.user ? svc.user.UserID : null;
    };

    this.userFullName = function()
    {
        if(!svc.user) return "nobody";
        if(!svc.user.FirstName && !svc.user.LastName)   return svc.user.Username;
        return String.append(svc.user.FirstName, " ", svc.user.LastName);
    };

    this.isMine = function(recipe)
    {
      return recipe && svc.user && recipe.UserID == svc.user.UserID;
    };

    this.isMobile = function() 
    { 
        return svc.clientIs("Android|webOS|iPhone|iPad|iPod|BlackBerry|Phone|mobile");
    };

    this.clientIs = function(str) 
    { 
        var reg = new RegExp(str, "i");
        return !!navigator.userAgent.match(reg);
    };

    this.clientIsIE = function() 
    { 
        return svc.clientIs("MSIE|Trident");
    };

    this.init();
}]);
