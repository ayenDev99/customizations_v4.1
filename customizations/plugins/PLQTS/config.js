var isNewTouchTransaction = false;
var documentCtrl = ['ModelEvent', '$q', 'DocumentPersistedData', 'ResourceNotificationService', '$uibModal', 'Templates', 'ModelService', '$rootScope', 'HookEvent', '$stateParams', 'base64', '$http', 'prismSessionInfo', 'authService', 'LoadingScreen', '$location',
	function(ModelEvent, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, LoadingScreen, $location) {
    var handlerAfter = function($q, document){
        var d = $q.defer();
        
        if (is_prism_qts_plugin_enabled) {
			var currentUri = $location.absUrl();

    		var containsSpecificString = currentUri.includes('touch');

    		if (containsSpecificString || isNewTouchTransaction) {

    			isNewTouchTransaction = false;

		        var modalOptions = {
				    backdrop: 'static',
				    size: 'md',
				    templateUrl: '/plugins/PLQTS/views/posFlagModal.htm',
				    controller: 'posFlagCtrl',
				    keyboard: false
				};

				$uibModal.open(modalOptions);

				d.resolve();
			} else { 
				d.resolve();
			}
    	} else {
	    	d.resolve();
	    }

        return d.promise;
    };

    ModelEvent.addListener('document', 'onAfterInsert', handlerAfter);
 }];
 ConfigurationManager.addHandler(documentCtrl);

// // Modifiers
ButtonHooksManager.addHandler(['before_navLandingTouchPos'],
    function($q) {
  	  	var deferred = $q.defer();
  	  	isNewTouchTransaction = true;
  	  	deferred.resolve();
  	  	return deferred.promise;
  	}
);

// // Modifiers
ButtonHooksManager.addHandler(['before_posTransactionTransactionType'],
    function($q, $uibModal) {
  	  	var deferred = $q.defer();
  	  	
  	  	if (is_prism_qts_plugin_enabled) {
			var modalOptions = {
			    backdrop: 'static',
			    size: 'md',
			    templateUrl: '/plugins/PLQTS/views/posFlagModal.htm',
			    controller: 'posFlagCtrl',
			    keyboard: false
			};

			$uibModal.open(modalOptions);
    	}

  	  	deferred.resolve();
  	  	return deferred.promise;
  	}
);

// // Modifiers
ButtonHooksManager.addHandler(['before_posTransactionItemModifiers'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, LoadingScreen) {
  	  	var deferred = $q.defer();

  	  	// LoadingScreen.Enable = 1;


  	  	// Set the interval
		var interval = setInterval(function() {

			var dataItemSid = $(HookEvent.target).attr('data-item-sid');

			if (typeof dataItemSid !== 'undefined') {
				clearInterval(interval);

				var modalOptions = {
				    backdrop: 'static',
				    size: 'md',
				    templateUrl: '/plugins/PLQTS/views/modifiersModal.htm',
				    controller: 'modifiersModalCtrl',
				    keyboard: false,
				    resolve: {
						dataItemSid: function() {
							return dataItemSid;
						}
					}
				};

				$uibModal.open(modalOptions);
			}

		}, 500);
  	  	

  	  	deferred.resolve();
  	  	return deferred.promise;
    }
);
