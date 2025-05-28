SideButtonsManager.addButton({
    label: 'Sales Report',
    sections: ['register', 'transactionRoot', 'transactionEdit'],
    handler: ['$uibModal', 'authService', function($modal, authService) {
        var modalOptions = {
            backdrop: 'static',
            windowClass: 'full',
            templateUrl: '/plugins/PLBIRReports/index.htm',
            controller: 'birReportsCtrl'
        };

        authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                $modal.open(modalOptions);
            }
        });
    }]
});