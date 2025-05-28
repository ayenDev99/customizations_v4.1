var closeCtrl = ["$scope", "$rootScope","$http", "$uibModalInstance", "LoadingScreen", "NotificationService",
    function($scope, $rootScope, $http, $uibModalInstance, LoadingScreen, NotificationService ) {
        'use strict';
        $scope.close = function() {
            $uibModalInstance.dismiss('close');
            $uibModalInstance.dismiss()
        };
    }
];
    
window.angular.module('closeCtrl', []).controller('closeCtrl', closeCtrl);
