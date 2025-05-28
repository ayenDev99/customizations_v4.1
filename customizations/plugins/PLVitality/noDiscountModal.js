var noDiscount = ["$scope", "$rootScope", "$http", "$uibModalInstance", "LoadingScreen", "NotificationService", "noDiscount",
    function ($scope, $rootScope, $http, $uibModalInstance, LoadingScreen, NotificationService, noDiscount) {
        'use strict';
        $scope.accountDetails = noDiscount.accountDetails;
        $scope.noAppliedAmount = 0;
        $scope.close = function() {
            $uibModalInstance.dismiss('close');
        };
    }
];
    
window.angular.module('noDiscount', []).controller('noDiscount', noDiscount);