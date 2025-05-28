var appliedDiscount = ["$scope", "$rootScope", "$http", "$uibModalInstance", "LoadingScreen", "NotificationService", "appliedDiscount",
    function ($scope, $rootScope, $http, $uibModalInstance, LoadingScreen, NotificationService, appliedDiscount) {
        'use strict';
        $scope.item_details = appliedDiscount.item_details;
        $scope.accountDetails = appliedDiscount.accountDetails;
        $scope.discountSubtracted = appliedDiscount.discountSubtracted;
        $scope.discountAmount = appliedDiscount.discountAmount;
        $scope.qty = appliedDiscount.qty;
        $scope.latestCredit = appliedDiscount.updatedRemainingBalance;
        $scope.updated_price = appliedDiscount.updated_price;
        $scope.TotalDiscountAmount = appliedDiscount.realtimeDiscountAmount;
        $scope.updateBalance = appliedDiscount.updatedRemainingBalance;
        $scope.exceed = appliedDiscount.updatedRemainingBalance >= 0 
                        ? appliedDiscount.updatedRemainingBalance  
                        : appliedDiscount.accountDetails.eligibilityDetails[0].limits[0].amountRemaining - (appliedDiscount.item_details.price - appliedDiscount.discountAmount) * appliedDiscount.qty
        $scope.exceedAmount = 0;//(appliedDiscount.item_details.price - appliedDiscount.discountAmount) * appliedDiscount.qty;
        $scope.exceedLimit = appliedDiscount.accountDetails.eligibilityDetails[0].limits[0].amountRemaining;
        $scope.close = function() {
            $uibModalInstance.dismiss('close');
        };
    }
];
    
window.angular.module('appliedDiscount', []).controller('appliedDiscount', appliedDiscount);
