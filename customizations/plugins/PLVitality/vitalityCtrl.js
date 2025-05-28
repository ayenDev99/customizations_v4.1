var PLVitalityModalCtrl = ["$scope", "$rootScope","$http", "$uibModalInstance", "$uibModal", "LoadingScreen", "NotificationService", "accessToken", "$state",
    function($scope, $rootScope, $http, $uibModalInstance, $uibModal, LoadingScreen, NotificationService, accessToken, $state,) {
        'use strict';
        $scope.closeModal = function(){
            $uibModalInstance.close();
        };

        $scope.submitDetails = function() {
            $scope.token = accessToken;
            sessionStorage.setItem('accessToken', JSON.stringify($scope.token));
            var barcode = document.getElementById("eligibility-input").value;
            if (!barcode) {
                alert("Please enter a barcode.");
                return;
            }
            $http({
                method: "POST",
                url: "/plugins/PLVitality/requestMembersInfo.php",
                data: JSON.stringify({ barcode: barcode })
            }).then(function(response) {
                
                var result = response.data;
                var parsedDetails = JSON.parse(JSON.stringify(result));
                sessionStorage.setItem('details', JSON.stringify(parsedDetails));
                
                if(result.eligibilityDetails[0].eligible == 'true'){
                    var details = result;
                    $uibModal.open({
                        templateUrl: '/plugins/PLVitality/views/eligibilityModal.htm', // Your modal template file
                        controller: 'VitalityDiscountCtrl',
                        size: 'md',
                        backdrop: 'static',
                        resolve: {
                            eligibilityDetails: function() {
                                return details; // Pass details to the modal
                            },
                        }
                    });
                    setTimeout(() => {
                        $state.go($state.current, {}, {reload: true});
                        $("#closeModals").trigger("click");
                    }, 1000);
                }else{
                    var details = result; 
                    $uibModal.open({
                        templateUrl: '/plugins/PLVitality/views/noteligibilityModal.htm', 
                        controller: 'VitalityDiscountCtrl',
                        size: 'md',
                        backdrop: 'static',
                        resolve: {
                            eligibilityDetails: function() {
                                return details; // Pass details to the modal
                            }
                        }
                    });
                    setTimeout(() => {
                        $state.go($state.current, {}, {reload: true});
                        sessionStorage.removeItem('sessionIndex');
                        sessionStorage.removeItem('accessToken');
                        sessionStorage.removeItem('details');
                    }, 1000);
                }
            }, function(error) {
                console.error("Error:", error);
                alert("Error retrieving member info.");
                return;
            });
        };
    }
];
    
window.angular.module('PLVitalityModalCtrl', []).controller('PLVitalityModalCtrl', PLVitalityModalCtrl);
    