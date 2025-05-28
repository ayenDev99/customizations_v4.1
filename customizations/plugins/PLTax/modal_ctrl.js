var wtaxModalCtrl = ["ResourceNotificationService", "$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModalInstance", "$uibModal", "XZOutReporter", "$state", "base64","$q","PrintersService","PrismUtilities","$filter","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService",
function(ResourceNotificationService, $scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModalInstance, $uibModal, XZOutReporter, $state, base64, $q, PrintersService, PrismUtilities, $filter, $window, RN, LoadingScreen, NotificationService) {
    'use strict';
    var sess = $http.defaults.headers.common['Auth-Session'];
    var servername = $window.location.origin;


    $scope.percOptions = [];

    $scope.wTaxPerc = null;

    $scope.wTax = "";

    var max = config_wtax_max_perc;
    var min = config_wtax_min_perc;
    var divisibility = config_wtax_perc_divisibility;

    if (divisibility > 0) {
        var tempDivisibility = divisibility;
        for (var i = divisibility; i<=max; i=tempDivisibility) {
            if (tempDivisibility >= min && tempDivisibility <= max) {
                $scope.percOptions.push({
                    value: tempDivisibility
                })
            }
            tempDivisibility += divisibility;
        }
    }

    $scope.computeWithholdingTax = function() {
        var docSid = $stateParams.document_sid;

        ModelService.get('Document', {sid: docSid}).then((docs) => {
            var doc = docs[0];
            var total = doc.transaction_total_amt - doc.transaction_total_tax_amt;
            $scope.wTax =  Math.abs(($scope.wTaxPerc.value / 100) * total).toFixed(2);
        });
    }

    $scope.closeModal = function(){
        $uibModalInstance.dismiss();
        $state.go($state.current, {}, {reload: true});
    };

    $scope.apply = function(){
        LoadingScreen.Enable = 1;

        var docSid = $stateParams.document_sid;

        ModelService.get('Document', {sid: docSid}).then((docs) => {
            var doc = docs[0];

            var tender = ModelService.create('Tender');
            tender.tender_name = "Withholding Tax";
            tender.tender_type = 3;

            if (doc.receipt_type == 1) {
                tender.given = $scope.wTax;
            } else {
                tender.taken = $scope.wTax;
            }

            tender.insert({document_sid:docSid}).then(() => {
                RN.showSuccessfulMessage('Success', 'Success on applying '+$scope.wTaxPerc.value+'% withholding tax.');
                LoadingScreen.Enable = 0;
                $state.go($state.current, {}, {reload: true});
                $scope.closeModal();
            }, (err) => {
                console.log(err);
                RN.showError('Error', 'Unable to apply withholding tax.');
                LoadingScreen.Enable = 0;
                $scope.closeModal();
            });
        });
    };
}];

window.angular.module('wtaxModalCtrl', []).controller('wtaxModalCtrl', wtaxModalCtrl);
