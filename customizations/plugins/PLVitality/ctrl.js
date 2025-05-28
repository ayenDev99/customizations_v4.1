var PLVitality = ["$scope", "$rootScope","$http", "ModelService","ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$timeout" ,"$filter",
	function($scope, $rootScope ,$http, ModelService, ModelService2,$stateParams, prismSessionInfo, $location, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $timeout ,$filter) {
		'use strict';

        $scope.isDisabled = true;
        function checkURL() {
            return window.location.hash.includes("/new");
        }

        try {
            if(checkURL()){
                $scope.isDisabled = false;
            }else{
                $scope.isDisabled = true;
            }
        } catch (e) {
            console.error("Error parsing sessionStorage.details:", e);
            $scope.details2 = null;
        }

        $scope.vitalityDiscount = function(test = false) {
            $http({
                method: 'POST',
                url: '/plugins/PLVitality/requestToken.php', // Your PHP proxy
                data: {
                    grant_type: 'client_credentials'
                }
            }).then(function successCallback(response) {
                var result = JSON.parse(response.data);
                var access_token = result.access_token;
                var modalOptions = {
                    backdrop: 'static',
                    size: 'md',
                    templateUrl: '/plugins/PLVitality/views/vitalitymodal.htm',
                    keyboard: false,
                    controller: 'PLVitalityModalCtrl',
                    resolve: {
                        accessToken: function() {
                            return access_token; 
                        }
                    }
                };
                $uibModal.open(modalOptions);
            }, function errorCallback(error) {
                console.error('Error:', error);
                alert('Error occurred: ' + (error.data ? error.data.message : 'Unable to connect to server.'));
            });
        };
    }
];

window.angular.module('PLVitality', [])
	.controller('PLVitality', PLVitality);