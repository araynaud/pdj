'use strict';

angular.module('pdjServices')
.service('AlbumService', ['$window', '$q', '$resource', 'ConfigService', function($window, $q, $resource, ConfigService) 
{
    if(!$window.Album) return;

    var svc = this;
    window.AlbumService = this;

    svc.init = function()
    {
        if(!$window.Album) return;

        svc.getConfig = ConfigService.getConfig;

        Album.serviceUrl = svc.getConfig("MediaThingy.root");
        if(String.isExternalUrl(Album.serviceUrl))
            Album.proxy = svc.getConfig("api.proxy");

        svc.serviceUrl = String.combine(Album.proxy, Album.serviceUrl, "data.php");
        svc.defaults = { data: "album", config: true, details: 3 };
        svc.albumResource =  $resource(svc.serviceUrl, svc.defaults);

        svc.actionResource =  $resource("api/action.php", svc.defaults);
        svc.options = svc.getConfig("MT.album");        
    };

    svc.loadAlbum = function(path)
    {
        var startTime = new Date();
        var deferred = $q.defer();
        svc.albumResource.get({path: path}, function(response)
        {
            response.requestTime = new Date() - startTime;
            svc.album = new Album(response);
            svc.album.setOptions(svc.options);
            svc.pics = svc.album.selectSlideshowFiles();

            deferred.resolve(svc.album);
        });
        return deferred.promise;
    };

    svc.hasPhoto = function()
    {
        return !isEmpty(svc.pics);
    };

    svc.mainImage = function()
    {
        return isEmpty(svc.pics) ? null : svc.pics[0].getThumbnailUrl(1);
    };

    svc.deleteImage = function(path, file)
    {
        var startTime = new Date();
        var deferred = $q.defer();
        svc.actionResource.get({path: path, file: file, action: "delete"}, function(response)
        {
            response.requestTime = new Date() - startTime;
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    svc.renameImage = function(path, file, to)
    {
        var startTime = new Date();
        var deferred = $q.defer();
        var action = to ? "rename" : "main";
        svc.actionResource.get({path: path, file: file, to: to, action: action}, function(response)
        {
            response.requestTime = new Date() - startTime;
            deferred.resolve(response);
        });
        return deferred.promise;
    };


    svc.init();
}]);
