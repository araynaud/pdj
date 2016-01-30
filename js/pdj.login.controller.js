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
        angular.merge(lc.form, ConfigService.getConfig("login"));

        if(LocationService.countries)
          lc.countries = LocationService.countries;
        else if(ConfigService.stateIs("signup"))
          LocationService.loadCountries().then(function(response) 
          {
            lc.countries = response;
          });
    };

    lc.login = function()
    {
      if(!lc.form.username || !lc.form.password) 
        return false;

      var postData = {};
      angular.merge(postData, lc.form);
//      if($window.md5)  postData.password = md5(lc.form.password);
      lc.post(postData);
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
      var address = String.append(lc.form.location, " ", valueIfDefined("country.country_code", lc.form));
      LocationService.geocode(address).then(function(response)
      { 
        lc.geocode = response;
        lc.first = response.results[0];
        lc.geoLocation = LocationService.getLocation(response.results[0]);
        delete lc.first.address_components;
        delete lc.first.geometry;
      });
    };


//RegisterModel { UserName; Email; Password; ConfirmPassword; FirstName; LastName; City; StateProvince; Country; }
    lc.signup = function()
    {
      if(!lc.form.username || !lc.form.password || !lc.form.password2 || !lc.form.email) 
        return false;

      if(lc.form.password != lc.form.confirmPassword)
        return lc.message = "Passwords do not match.";

      var postData = {action: "signup"};
      angular.merge(postData, lc.form);

//      if($window.md5) postData.password = md5(lc.form.password);
      delete postData.password2;
      lc.post(postData);
    };

    lc.post = function(postData)
    {
      lc.loading = true;
      ConfigService.login(postData).then(function(response) 
      {
          lc.loading = false;
          if(ConfigService.user)
              ConfigService.returnToMain();
          else
            lc.message = response.Message;
      });
    };

    lc.init();

}]);
