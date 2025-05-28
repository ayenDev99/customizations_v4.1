SideButtonsManager.addButton({
    label: 'eJournal',
    sections: ['register', 'transactionRoot', 'transactionEdit'],
    handler: ['$uibModal', 'authService', function($modal, authService) {
        var modalOptions = {
            backdrop: 'static',
            windowClass: 'full',
            templateUrl: '/plugins/eJournal/index.htm',
            controller: 'ejournalCtrl'
        };

        authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                $modal.open(modalOptions);
            }
        });
    }]
});


// Copy notes general from return receipt to the current transaction
var docInsertHandler = ['ModelEvent', 'ModelService', 'authService', '$uibModal', function(ModelEvent, ModelService, authService, $uibModal){

    // Event handler to capture after item insert in the current document
    var beforeDocInsert = function($q, doc) {
        var deferred = $q.defer();


        authService.checkLicense().then(function(checkLicense) {
            
            if (checkLicense) {
                $.ajax({
                    url: 'plugins/ejournal/dumping.php',
                    method: 'GET',
                    data: { action: 'checkRecupdate' },
                    success: function(data) {
                        var result = JSON.parse(data);
                        if (result.success) {
                            deferred.resolve();
                        } else {
                            deferred.reject();
                            alert('Unable to create transaction. Previous EOD was not performed.');
                        }
                    }
                });
            } else {
                deferred.resolve();
            }

        });            

        return deferred.promise;
    };

    ModelEvent.addListener('document', 'onBeforeInsert', beforeDocInsert);
}]

ConfigurationManager.addHandler(docInsertHandler);