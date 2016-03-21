angular.module('app').directive('starRating', [ "$timeout", function ($timeout) 
{
    return {
        scope: { label: "@", value: "=", min: "=", max: "=", readonly: "=", change: "=" },
        templateUrl: './directives/starRating.html',
        controllerAs: 'vm',
        bindToController: true,
        link: function (scope, element, attr, vm) 
        {
        },
        controller: function ()
        {
            var vm = this;
            window.starRating = this;
            vm.init = function()
            {
                vm.min   = valueOrDefault(vm.min, 1);
                vm.max   = valueOrDefault(vm.max, 5);
                vm.value = valueOrDefault(vm.value, 0);
                vm.stars = vm.getStars(vm.max - vm.min + 1);
            };

            vm.getStars = function(n)
            {
                return new Array(n);
            };

            vm.setValue = function(n)
            {
                vm.value = n + vm.min;
            };

            vm.starClasses = function(n)
            {
                var cls = (n + vm.min > vm.value) ? "glyphicon-star-empty" : "glyphicon-star";
                var classes = {};
                classes[cls] = true;
                return classes;
            };            
            vm.init();
        }
    };
}]);
