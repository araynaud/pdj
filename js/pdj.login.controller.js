'use strict';

// =========== LoginController ===========
// handles login (sign in), register (sign up), logout, 
angular.module('pdjControllers')
.controller('LoginController', ['$window', 'ConfigService', 'LocationService',
function ($window, ConfigService, LocationService)
{
    //TODO:
    //post login, md5(password)
    //to PHP login.php service
    //query user table where username = user and password = md5
    //if success: store session["username"]
    //else : unset session["username"]
    //return user object with name
    var lc = this;
    $window.LoginController = this;

    lc.init = function()
    {
        lc.showDebug = ConfigService.isDebug();
        lc.form = {};

        var defaultLogin = ConfigService.getConfig("login");
        if(defaultLogin && ConfigService.stateIs("signin"))
          angular.merge(lc.form, defaultLogin);

        lc.loadCountries();
    };

    lc.loadCountries = function()
    {
        if(LocationService.countries)
          return lc.countries = LocationService.countries;

        if(ConfigService.stateIs("signup"))
          LocationService.loadCountries().then(function(response) { lc.countries = response; });
    }

    lc.login = function()
    {
      //if(!lc.form.username || !lc.form.password) 
      if(!lc.hasAllFields(lc.form, "username password"))
        return false;

      var postData = {};
      angular.merge(postData, lc.form);
//      if($window.md5)  postData.password = md5(lc.form.password);
      lc.post("SignIn", postData);
    };


//RegisterModel { UserName; Email; Password; ConfirmPassword; FirstName; LastName; City; StateProvince; Country; }
    lc.register = function()
    {
      if(!lc.hasAllFields(lc.form, "username password confirmPassword email"))
        return false;

      if(lc.form.password != lc.form.confirmPassword)
        return lc.message = "Passwords do not match.";

      var postData = {};
      angular.merge(postData, lc.form);

      lc.post("Register", postData);
    };

    lc.post = function(method, postData)
    {
      lc.loading = true;
      ConfigService.login(method, postData).then(function(response) 
      {
          lc.loading = false;
          if(ConfigService.user)
              ConfigService.returnToMain();
          else
            lc.message = response.Message;
      });
    };

    lc.loggedIn = function()
    {
      return !!ConfigService.user;
    };

    lc.logout = function()
    {
        return ConfigService.logout();
    };


    lc.lookupLocation = function()
    {
      var address = String.append(lc.form.location, " ", valueIfDefined("country.common_name", lc.form));
      LocationService.geocode(address).then(function(response)
      { 
        lc.geocode = response;
        lc.choices = lc.geocode.results.distinct("formatted_address");
        lc.selectedResult = lc.geocode.results[0];
        lc.selectLocation();
      });
    };

    lc.selectLocation = function()
    {
        lc.geoLocation = LocationService.getLocation(lc.selectedResult);
        angular.merge(lc.form, lc.geoLocation);
    };

    lc.hasAllFields = function(form, fields)
    {
        if(angular.isString(fields))
          fields = fields.split(" ");

        for(var i = 0; i < fields.length; i++)
          if(!form[fields[i]])
            return false;

        return true;
    };

    lc.init();

}]);
