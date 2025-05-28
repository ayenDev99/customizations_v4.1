ButtonHooksManager.addHandler(['before_zOutStructuredOpenRegister'],
    function($q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService) {
        var deferred = $q.defer();
        if (config_isOpenDrawerBlockingEnabled) {
        	ModelService.get('ZoutControl', { filter:"(period_end,NL)" }).then(function(zcontrol) {
        		// zcontrol.forEachWithCallback((el, i, next) => {

        		// });
        		if (zcontrol.length) {
        			alert("Previous drawer(s) opened. Unable to proceed.")
        		} else {
        			deferred.resolve();
        		}
        	});
        	deferred.reject();
        } else {
        	deferred.resolve();
        }
        
        return deferred.promise;
    }
);