'use strict';

// =========== LoginController ===========
// handles login (sign in), register (sign up), logout, 
angular.module('pdjControllers')
.controller('LoginController', ['$scope', '$window', 'ConfigService', 'LocationService',
function ($scope, $window, ConfigService, LocationService)
{
    //TODO:
    //post login, md5(password)
    //to PHP login.php service
    //query user table where username = user and password = md5
    //if success: store session["username"]
    //else : unset session["username"]
    //return user object with name
    var lc = this;
    lc.scope = $scope;
    $window.LoginController = this;

    lc.init = function()
    {
        lc.showDebug = ConfigService.isDebug();
        lc.form = {};
        lc.currentState = ConfigService.currentState();
        lc.stateIs = ConfigService.stateIs;
        lc.titles = {signup: "Create your account", profile: "Update your profile", signin: "Please log in"};
        lc.title = lc.titles[lc.currentState];

        lc.formFields = "username email password confirmPassword firstName lastName".split(" ");
        lc.locationFields = "City District RegionName RegionCode CountryName CountryCode".split(" ");

        var defaultLogin = ConfigService.getConfig(ConfigService.currentState());
        if(defaultLogin)
          angular.merge(lc.form, defaultLogin);
        lc.loadCountries();
        lc.loadUserProfile();
    };

    lc.loadUserProfile = function()
    {
        var fieldMap = { Username: "username", Email: "email",  FirstName: "firstName", LastName: "lastName", UserID: "userId" };
        ConfigService.getCurrentUser().then(function(user)
        {
          if(!user) return;

          lc.form   = Object.remap(user, fieldMap);
          lc.search = { location: user.Location};
          lc.lookupLocation();
        });
    }

    lc.loadCountries = function()
    {
        if(LocationService.countries)
          return lc.countries = LocationService.countries;

        //if(ConfigService.stateIs("signup"))
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
      if(!lc.hasAllFields(lc.form, lc.formFields) || !lc.hasAllFields(lc.location, lc.locationFields))
        return lc.message = "Please fill all required fields.";

      if(lc.form.password != lc.form.confirmPassword)
        return lc.message = "Passwords do not match.";

      var postData = {};
      angular.merge(postData, lc.form);
      angular.merge(postData, lc.location);

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

    lc.loggedIn = ConfigService.loggedIn;
    lc.logout = ConfigService.logout;

    lc.lookupLocation = function()
    {
      //if(!lc.search) return;
      var countryName =  valueIfDefined("search.country.common_name", lc)
      var address = valueIfDefined("search.location", lc);
      address = String.append(address, ", ", countryName);
//      if(!address) return;

      LocationService.geocode(address).then(function(response)
      { 
        lc.geocodeData = response;
        lc.selectedResult = lc.geocodeData.results[0];
        lc.selectLocation();
      });
    };

    lc.selectLocation = function()
    {
        lc.location = LocationService.getLocation(lc.selectedResult);
    };

    lc.hasAllFields = function(obj, fields)
    {
        if(!obj) return false;

        if(angular.isString(fields))
          fields = fields.split(" ");

        for(var i = 0; i < fields.length; i++)
          if(!obj[fields[i]])
            return false;

        return true;
    };

    lc.init();

}]);
