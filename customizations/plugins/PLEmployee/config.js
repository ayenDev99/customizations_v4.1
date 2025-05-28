var MyEmployeeController = ['ModelEvent', '$q', 'DocumentPersistedData', 'ResourceNotificationService', '$uibModal', 'Templates', 'ModelService', '$rootScope', 'HookEvent', '$stateParams', 'base64', '$http', 'prismSessionInfo', 'LoadingScreen', function(ModelEvent, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, LoadingScreen) {
    var handlerBefore = function($q, employee){
     	var d = $q.defer();
    	employee.drawer = 1;
    	d.resolve();
    	return d.promise;
    }

    ModelEvent.addListener('Employee', 'onBeforeInsert', handlerBefore);
 }];
 ConfigurationManager.addHandler(MyEmployeeController);
