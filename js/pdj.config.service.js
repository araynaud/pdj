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
        this.getCurrentUser();
    };

    this.getConfig = function(key)
    {
        return valueIfDefined(key, svc.config);
    }

    this.getResourceUrl = function(api, url, qs)
    {
        if(svc.offline)
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
        url = svc.getResourceUrl(api, url, qs);
        return $resource(url, defaults);
    };

    this.getFromResource = function(resource, params, key, obj)
    {
        if(!obj) obj = this;
        if(!params) params={ };

        var deferred = $q.defer();
        resource.get(params, function(response)
        { 
            var result = svc.onResponse(response, key, obj);
            deferred.resolve(result);
        });
        return deferred.promise;
    };

    this.postToResource = function(resource, params, post, key, obj)
    {
        if(!obj) obj = this;
        if(!params) params = { };
        if(!post)   post = { };

        var deferred = $q.defer();
        resource.save(params, post, function(response)
        { 
            var result = svc.onResponse(response, key, obj);
            deferred.resolve(result);
        });
        return deferred.promise;
    };

    //transform service response with a function or store it in a variable
    this.onResponse = function(response, key, obj)
    {
        var success = response.State == "SUCCESS";
        if(response.Data) 
            response = response.Data;
        response.success = success;

        if(angular.isFunction(key))
            response = key(response);
        else if(angular.isFunction(obj[key]))
            response = obj[key](response);
        else if(obj && key)
            obj[key] = response;
        
        return response;
    }

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
        if(!angular.isArray(st))
            return $state.is(st);

        for (var i = 0; i < st.length; i++)
            if($state.is(st[i]))
                return true;
        return false;
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
        var deferred = $q.defer();
        svc.user = null;
        svc.onUserChange();
        svc.loginResource.save({action: "SignOut"}, {}, function()
        {
            svc.phpLoginResource.save({action: "SignOut"});
            deferred.resolve(svc.user);
        });
        return deferred.promise;
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

            svc.onUserChange();
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

    this.getCurrentUser = function(update)
    {
        var deferred = $q.defer();
        if(svc.user && !update)
            deferred.resolve(svc.user);
        else
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

                svc.onUserChange();
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

    this.onUserChange = function()
    {
        svc.loggedIn  = svc.isLoggedIn();
        svc.admin     = svc.isAdmin();
        svc.sidebar   = null; //reset
        console.log("user change: loggedIn = " + svc.loggedIn);
    };

    this.isLoggedIn = function()
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
        return svc.clientIs("Android|webOS|iPhone|iPod|BlackBerry|Phone|mobile") && !svc.clientIs("iPad");
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

    this.scrollTop = function(time, y)    
    { 
        if(!y) y = 0;
        if(!time)
            $("html,body").scrollTop(y);
        else
            $("html,body").animate({scrollTop: y}, time);
    };

    svc.init();
}]);
