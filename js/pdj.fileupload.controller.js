'use strict';

// =========== File Upload Controller ===========
// handles query and gallery display
angular.module('pdjControllers')
.controller('UploadController', ['$window', '$stateParams', 'Upload', 'ConfigService', 'AlbumService',
function ($window, $stateParams, Upload, ConfigService, AlbumService)
{
    var uc = this;
    $window.UploadController = this;
    ConfigService.requireLogin();
    if(!$stateParams.recipeId)
        return RecipeService.returnToMain(1000);

    uc.init = function()
    {
        uc.offline    = ConfigService.isOffline();
        uc.showDebug  = ConfigService.getConfig("debug.angular");
        uc.baseUrl    = ConfigService.getConfig("upload.baseUrl");
        uc.baseServer = ConfigService.getConfig("upload.server");
        uc.isIE11     = ConfigService.clientIs("Trident/7.0");

        uc.recipeId = $stateParams.recipeId;
        uc.queued = true;
        uc.logReverse = false;
        uc.form = { recipeid: uc.recipeId };
        uc.loadData();
        uc.resetLog();
    };


//IE11 hack for file input label
    uc.browse = function()
    {
        if(uc.isIE11)
            angular.element("label[for=inputFiles]").click();
    }

//load existing recipe info from DB
//check if user has access to it.

    uc.getRecipeAlbumPath = function()
    {
       if(!uc.recipe) return null;
       return String.combine(RecipeService.getConfig("MediaThingy.imagesRoot"), RecipeService.getConfig("images.dir"), uc.recipe.UserID, uc.recipe.ID);
    }

    uc.loadData = function()
    {
        if(!uc.recipeId) return;

        RecipeService.loadRecipe(uc.recipeId).then(function(response) 
        {
          uc.loading = false;
          if(uc.error = RecipeService.isError(response))
          {
            uc.errorMessage(response);
            return RecipeService.returnToMain(2000);
          }
          uc.recipe = response;
          uc.loadRecipeImages();

          if(!uc.isMine(uc.recipe))
            return RecipeService.returnToMain();
        }, 
        uc.errorMessage);
    };

    uc.loadRecipeImages = function()
    {
      //load photo slideshow
      if(!$window.Album) return;

      var path = uc.getRecipeAlbumPath();
      if(!path) return;

      AlbumService.loadAlbum(path).then(function(albumInstance)
      {
          uc.hasPhoto = AlbumService.hasPhoto();
          if(!uc.hasPhoto) return;

          uc.pics = AlbumService.pics;
          uc.mainImage = AlbumService.getMainImage();
          if(uc.mainImage)
            uc.pics.remove(uc.mainImage);
          uc.mainImageUrl = AlbumService.mainImageUrl();
          uc.lastUpdate = +(new Date());
      });
    };

    uc.errorMessage =  function (result)
    {
        uc.loading = false;
        uc.status = "Error: No data returned";
    };

    uc.isMine = function()
    {
        return RecipeService.isMine(uc.recipe);
    };

    //post file
    //insert db record
    //return file metadata and upload id to form
    uc.upload = function()
    {
        uc.index=0;
        uc.resetLog();
        if(isEmpty(uc.files)) return false;

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
            uc.message = data.message;
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
        var url = String.combine(uc.baseUrl, ConfigService.currentUserId(), uc.recipeId, subdir, data.filename);
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
        uc.loadRecipeImages();

        if(isEmpty(uc.files) || uc.index >= uc.files.length) return;
        var file = uc.files[uc.index];
        uc.addLog();
        uc.addLog("uploadNextFile {0}/{1}: {2} ".format(uc.index+1, uc.files.length, file.name));
//        delete uc.form.upload_id;
        uc.uploadFile(file);
    };

    uc.selectImage = function(mf)
    {
        uc.selectedImage = mf;
    }

    uc.deleteImage = function(mf)
    {
        var path = uc.getRecipeAlbumPath();
        AlbumService.deleteImage(path, mf.filename).then(function(response)
        {
//            alert(app.toJson(response,true));
            uc.loadRecipeImages();  
            uc.lastUpdate = +(new Date());
        });
    };

    uc.setMainImage = function(mf)
    {
        var path = uc.getRecipeAlbumPath();
        AlbumService.renameImage(path, mf.filename).then(function(response)
        {
//            alert(app.toJson(response,true));
            uc.loadRecipeImages();
            uc.lastUpdate = +(new Date());
        });
    };

    //append current time to avoid image caching
    uc.thumbnailUrl =  function(mf, update)
    {
        if(!mf) return null;
        if(!update || !uc.lastUpdate) return mf.getThumbnailUrl();
        return mf.getThumbnailUrl() + '?t=' + uc.lastUpdate;
    };

    uc.confirmDelete = function () 
    {
        uc.showConfirm = true;
    };

    //if upload canceled: delete details
    //delete db record and uploaded file
    uc.cancelUpload = function() 
    {
        ConfigService.returnToMain();
    };

    uc.init();
}]);