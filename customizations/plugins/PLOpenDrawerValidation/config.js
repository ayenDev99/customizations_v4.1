ButtonHooksManager.addHandler(['before_navLandingNewTransaction', 'before_navPosTransactionNew'],
    function($q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService) {
        var deferred = $q.defer();

        if (config_openDrawerValidationEnabled) {
        	var session = JSON.parse(sessionStorage.getItem("session"));

        	ModelService.get('ZoutControl', { filter:"(workstation_sid,eq,"+session.workstationid+")", sort: "created_datetime,desc" }).then(function(zcontrol) {

        		if (zcontrol.length) {
        			var z = zcontrol[0];
        			var periodBegin = moment(z.period_begin);

        			var date = periodBegin.format('YYYY-MM-DD');
        			var today = moment();

        			today = today.format('YYYY-MM-DD');
        			console.log(date,today);

        			if (date == today) {
        				deferred.resolve();
        			} else {
        				if (z.period_end == "") {
	        				ResourceNotificationService.showError('Error', 'Unable to create new transaction. Previous drawer is not yet reconciled. Please reconcile the previous drawer.');
	        				deferred.reject();
	        			} else {
	        				deferred.resolve();
	        			}
        			}
        		} else {
        			deferred.resolve();
        		}

        	});
        } else {
        	deferred.resolve();
        }
        
        return deferred.promise;
    }
);