'use strict';

// =========== LoginController ===========
// handles login (sign in), register (sign up), logout, 
angular.module('pdjControllers')
.controller('LoginController', ['$window', '$state', 'ConfigService', 
function ($window, $state, ConfigService)
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
    this.state = $state;
    lc.form = { };

    lc.login = function()
    {
      var postData = {action: "login"};
      angular.merge(postData, lc.form);
      if(!lc.form.username || !lc.form.password) 
        return false;
      if($window.md5)
        postData.password = md5(lc.form.password);
      lc.post(postData);
    };

    lc.loginTest = function()
    {
      var postData = {action: "login"};
      postData.username = "araynaud";
      postData.password = "!cook4512";
      postData.rememberMe = true;
      lc.post(postData);
    };

    lc.signup = function()
    {
      var postData = {action: "signup"};
      angular.merge(postData, lc.form);
      if(!lc.form.username || !lc.form.password || !lc.form.password2 || !lc.form.email) 
        return false;

      if(lc.form.password != lc.form.password2)
        return lc.message = "Passwords do not match.";

      if($window.md5)
        postData.password = md5(lc.form.password);
      delete postData.password2;
      lc.post(postData);
    };

    lc.post = function(postData)
    {
      lc.loading = true;
      ConfigService.login(postData).then(function(response) 
      {
          lc.loading = false;
          lc.user = response.user; 
          lc.loggedIn = response.success;
          lc.message = response.message;
          if(ConfigService.user)
            $state.go('main');
      });
    };

}]);
