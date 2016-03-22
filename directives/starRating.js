angular.module('app').directive('starRating', function () 
{
    return {
        scope: { label: "@", userLabel: "@", global: "=", user: "=", readOnly:"=", min: "=", max: "=", readonly: "=", change: "=" },
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
                vm.plural = plural;
                vm.min   = valueOrDefault(vm.min, 1);
                vm.max   = valueOrDefault(vm.max, 5);
                if(!vm.global) vm.global = {};
                if(!vm.user)   vm.user   = {};
                vm.user.Score = valueOrDefault(vm.user.Score, 0);
                vm.stars = vm.getStars(vm.max - vm.min + 1);
            };

            vm.edit = function()
            {
                vm.editing = !vm.readOnly;
            }

            vm.stopEdit = function()
            {
                vm.editing = false;
            }

            vm.getStars = function(n)
            {
                return new Array(n);
            };

            vm.setValue = function(n)
            {
                if(vm.readOnly) return;

                vm.oldValue = vm.user ? vm.user.Score : 0;
                if(!vm.user)   vm.user   = {};
                vm.user.Score = n + vm.min;

                if(angular.isFunction(vm.change))
                    vm.change(vm.user.Score, vm.oldValue);

                vm.editing = false;
            };

            vm.starClasses = function(n)
            {
                var cls = (!vm.user || (n + vm.min > vm.user.Score)) ? "glyphicon-star-empty" : "glyphicon-star";
                var classes = {};
                classes[cls] = true;
                return classes;
            };            
            vm.init();
        }
    };
});
