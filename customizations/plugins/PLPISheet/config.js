
ButtonHooksManager.addHandler(['before_updatePISheetBtn'],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, NotificationService) {
    	var deferred = $q.defer();

    	var radio = '';

    	if($('[name="elmUmAll"]').is(':checked')) { radio = 'all'; }
    	if($('[name="elmUmQtyOnly"]').is(':checked')) { radio = 'qty'; }


    	var title = '';
    	var body = '';

    	if (radio == 'all') {
    		title = 'All Counts was selected!';
    	} else {
    		title = 'Quantities Only was selected!'
    	}
    	
    	if (radio == 'all') {
    		body = 'If a count is specified in the PI Sheet, Prism will update the Item’s onhand qty to match the count on the PI Sheet.<br>';
    		body += 'If a count is not specified on the PI Sheet for the item, Prism will set the Item’s on-hand qty to zero.';
    	} else {
    		body = 'If a count is specified in the PI Sheet, Prism will update the Item’s onhand qty to match the count on the PI Sheet.<br>';
    		body += 'If a count is not specified on the PI Sheet for the item, Prism makes no change';
    	}
    	

    	var confirm = NotificationService.addConfirm(body, title, 'static', true);

    	setTimeout(() => {
    		var notif = $('#Notifications');
    		var text = notif.find('[ng-if="(settings.msg * 1).toString()!==settings.msg"]').text();
    		notif.find('#notificationsYesButton').text('Proceed');
    		notif.find('#notificationsNoButton').text('Cancel');
    		notif.find('[ng-if="(settings.msg * 1).toString()!==settings.msg"]').html(text);
    	},100);
        
        confirm.then(function(x){
            if (x) {
                deferred.resolve();
            } else {
            	deferred.reject();
            }
        });
    	
    	
    	return deferred.promise;
    }
);