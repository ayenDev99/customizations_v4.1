var VitalityDiscountCtrl = ["$scope", "$rootScope","$http", "$uibModalInstance", "LoadingScreen", "NotificationService", "eligibilityDetails",
    function($scope, $rootScope, $http, $uibModalInstance, LoadingScreen, NotificationService, eligibilityDetails) {
        'use strict';
        $scope.details = eligibilityDetails; // Pass the details to modal scope

        $scope.close = function() {
            $uibModalInstance.dismiss('close');
        };
    }
];
    
window.angular.module('VitalityDiscountCtrl', []).controller('VitalityDiscountCtrl', VitalityDiscountCtrl);
