angular.module('app').directive('categorySelect', function () 
{ 
    return {
        scope: { types: '=', selected: '=', selectedArray: '=', change: '=' },
        templateUrl: './directives/categorySelect.html',
        controllerAs: 'vm',
        bindToController: true,
        replace: true,
        controller: function($timeout)
        {
            var vm = this; 
            window.categorySelect = vm;
            vm.selectedArray = Object.keys(vm.selected);

            vm.isSelected = function(id)
            {
                return vm.selected && !!vm.selected[id];
            };

            vm.toggle = function(id, st)
            {
                st = valueOrDefault(st, !vm.isSelected(id));
                if(st)
                    vm.selected[id] = id;
                else 
                    delete vm.selected[id];

                vm.selectedArray = Object.keys(vm.selected);
                if(angular.isFunction(vm.change))
                    $timeout(vm.change, 0);
                return vm.selected;
            };

            vm.clear = function()
            {
                Object.clear(vm.selected);
                vm.selectedArray.splice(0); //clear all but keep same array instance
                if(angular.isFunction(vm.change))
                     $timeout(vm.change, 0);             
            }
        }         
    }
});
