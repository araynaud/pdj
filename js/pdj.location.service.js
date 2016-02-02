'use strict';

angular.module('pdjServices')
.service('LocationService', ['$http', '$q', '$resource', 'ConfigService', function($http, $q, $resource, ConfigService) 
{
    var svc = this;
    window.LocationService = this;
    this.init = function()
    {
        this.offline = ConfigService.isOffline();
        this.getConfig = ConfigService.getConfig;

        var googleApiUrl = this.getConfig("api.google.url");
        var defaults     = this.getConfig("api.google.defaults");
        this.googleResource = $resource(googleApiUrl, defaults);
//        this.loadCountries();
    };

    this.geocode = function(address)
    {
        var deferred = $q.defer();
        this.googleResource.get({ address: address }, function(response)
        {
            deferred.resolve(response);
        });
        return deferred.promise;
    };

/*extract fields from geocode data:

"City": "Sunnyvale", 
"RegionName": "California",
"RegionCode": "CA",
"District": "Santa Clara County",
"CountryCode": "US"
*/
    this.getLocation = function(geocode)
    {
        var locationFields = {};
        if(!geocode) return locationFields;
        var types = 
        {
            locality: "City",
            administrative_area_level_2: "District",
            administrative_area_level_1: "Region",
            country: "Country",
        };
        if(geocode && geocode.address_components)
            geocode.address_components.forEach(function(el)
            {
                var key = el.types[0];
                var field = types[key];
                if(field && el.long_name === el.short_name)
                    locationFields[field] = el.long_name;                     
                else if(field)
                {
                    locationFields[field+"Name"] = el.long_name; 
                    locationFields[field+"Code"] = el.short_name; 
                }
            });

        locationFields.type = geocode.types[0];
        return locationFields;
    };

    this.loadCountries = function()
    {
        var deferred = $q.defer();
        $http.get("api/countries.csv").then(function(response) 
        {
            svc.countries = String.parseCsv(response.data, true);
            svc.countries.byCode = svc.countries.indexBy("country_code");
            deferred.resolve(svc.countries);
        });
        return deferred.promise;
    };

    this.init();

}]);
