'use strict';

// =========== File Upload Controller ===========
// handles query and gallery display
angular.module('pdjControllers')
.controller('UploadController', ['$scope', '$window', '$state', '$stateParams', '$timeout', 'Upload', 'ConfigService',
function ($scope, $window, $state, $stateParams, $timeout, Upload, ConfigService)
{
    var uc = this;
    $window.UploadController = this;
    ConfigService.requireLogin();

    uc.init = function()
    {
        uc.offline =    ConfigService.isOffline();
        uc.showDebug =  ConfigService.getConfig("debug.angular");
        uc.baseUrl =    ConfigService.getConfig("upload.baseUrl");
        uc.baseServer = ConfigService.getConfig("upload.server");

        uc.newUpload = !$stateParams.uploadId;
        uc.queued = true;
        this.scope = $scope;
        this.state = $state;
        uc.logReverse = false;
        uc.form = {};
        uc.loadData();
        uc.form.shared_with = 1;
        uc.resetLog();

    //date picker options
        uc.datepickerOpen=false;
        uc.dateFormat = 'MMMM dd, yyyy';
        uc.dateOptions = { formatYear: 'yy', startingDay: 1 };
        uc.today = new Date();
        uc.pickDate = function() { uc.datepickerOpen = true; };
        uc.setToday = function() { return uc.form.image_date_taken = uc.today; };
        uc.setToday();
    // end date picker options

        var meals = ConfigService.getConfig("dropdown.meal");
        if(meals)
        {
            uc.meals = meals.distinct("name");
            uc.meals.byName = meals.indexBy("name");
        }
    };

//load existing image info from DB
    uc.loadData = function()
    {
        if(uc.newUpload) return;

        var params = { upload_id: $stateParams.uploadId };
        QueryService.loadQuery(params).then(function(response) 
        {
            if(isEmpty(response))
            {
                uc.errorMessage(response);
                uc.returnToMain();
            }

            uc.form = response[0];
            uc.imageUrl =  uc.getImageUrl(uc.form, ".ss");
            uc.uploadUrl = uc.getImageUrl(uc.form, ".tn");
            delete uc.form.exists; 
            delete uc.form.searchText; 
            uc.users = QueryService.users;
        }, 
        uc.errorMessage);
    };

    uc.errorMessage =  function (result)
    {
        uc.loading = false;
        uc.status = "Error: No data returned";
    };

    uc.validate = function()
    {
        return 
//        $scope.uploadForm.file.$invalid && !$stateParams.uploadId //file required for new upload || 
        $scope.uploadForm.image_date_taken.$invalid
        || $scope.uploadForm.caption.$invalid
        || $scope.uploadForm.meal.$invalid;
    };

    //post file
    //insert db record
    //return file metadata and upload id to form
    uc.upload = function()
    {
        uc.index=0;
        uc.resetLog();
        if(isEmpty(uc.files)) return false;

        delete uc.form.upload_id;
        if(!angular.isArray(uc.files))
            return uc.uploadFile(uc.files);

        if(uc.queued)
            return uc.uploadFile(uc.files[0]);

        for(var i = 0; i < uc.files.length; i++) 
            uc.uploadFile(uc.files[i]);
    };

    uc.uploadFile = function(file) 
    {
        uc.progressPercentage="";
        uc.uploadUrl="";
//        uc.form.debug=true;
        Upload.upload({ url: 'api/upload.php', fields: uc.form, file: file })
        .progress(function (evt) 
        {
            uc.progressPercentage="";
            if(uc.files.length>1)
                uc.progressPercentage = "File {0}/{1} ".format(uc.index+1, uc.files.length);

            uc.progressPercentage += parseInt(100.0 * evt.loaded / evt.total) + '%';
            if(!uc.showDebug) return;

            var fname = (evt.config && evt.config.file? evt.config.file.name : "(none)");
            uc.addLog('progress: {0} {1}'.format(uc.progressPercentage, fname));
        })
        .success(function (data, status, headers, config) 
        {
            uc.progressPercentage="";
            data.exists=true;
            uc.uploadUrl = uc.getImageUrl(data, ".tn");
            uc.form.upload_id = data.upload_id;
            uc.parseDate(data.dateTaken);
            uc.message=data.message;
            //TODO: message ng-class depending on data.success
            if(data.description)
                uc.form.caption = data.description;

            var fname = (file ? file.name : "(none)");
            uc.addLog('uploaded file: {0}, status: {1}, Response:'.format(fname, status));
            uc.addLog(data);

            if(uc.queued)
                uc.uploadNextFile();
        });
    };

    uc.getImageUrl = function (data, subdir)
    {
        var url = String.combine(uc.baseUrl, ConfigService.user.username, subdir, data.filename);
        if(!data.exists && uc.baseServer) url = uc.baseServer + url;
        return url;
    };

    uc.resetLog = function (message)
    {
        return uc.log = "";
    };

    uc.addLog = function (message, append)
    {
        if(!uc.showDebug) return;

        if(!message)
            message = "";
        else if(angular.isObject(message))
            message = angular.toJson(message, true);

        if(uc.logReverse)
            uc.log = message + "\n" + uc.log;
        else
            uc.log = uc.log + "\n" + message;
        return uc.log;
    };

    uc.uploadNextFile = function()
    {
        uc.index++;
        if(isEmpty(uc.files) || uc.index >= uc.files.length) return;
        var file = uc.files[uc.index];
        uc.addLog();
        uc.addLog("uploadNextFile {0}/{1}: {2} ".format(uc.index+1, uc.files.length, file.name));
        delete uc.form.upload_id;
        uc.uploadFile(file);
    };

    uc.parseDate = function(dt)
    {
        if(!dt) return; // uc.dateTaken = uc.form.image_date_taken = null;

        uc.dateTaken = dt.replace(/-/g, '/');
        uc.form.image_date_taken = new Date(uc.dateTaken);
        return uc.form.image_date_taken;
    };

    //select meal based on photo time
    uc.getCourses = function()
    {
        var mealId = uc.form.meal; 
        if(!mealId) return [];
        return uc.meals.byName[mealId].courses || [];
    };

    //post details
    //update db record
    uc.saveUpload = function () 
    {
        //file is already uploaded: post only form data to upload api
        Upload.upload({ url: 'api/upload.php', fields: uc.form }).success(function (data, status, headers, config) 
        {
            uc.message=data.message;
            if(data.success)
                uc.returnToMain();
            uc.addLog(data);
        });
    };

    uc.confirmDelete = function () 
    {
        uc.showConfirm = true;
    };

    uc.deleteFile = function () 
    {
        if(!uc.form.upload_id) return;
        Upload.upload({ url: 'api/delete.php', fields: {upload_id: uc.form.upload_id} }).success(function (data, status, headers, config) 
        {
            uc.message=data.message;
            if(data.success)
                uc.returnToMain();
            uc.addLog(data);
        });
    };


    uc.returnToMain = function(delay)
    {
        if(!delay)
            return $state.go('list');

        $timeout(function() { $state.go('list'); }, delay);
    };

    //if upload canceled: delete details
    //delete db record and uploaded file
    uc.cancelUpload = function() 
    {
        uc.returnToMain();
    };

    uc.init();
}]);