var posFlagCtrl = ["$scope", "$http", "prismSessionInfo", "Preferences", "authService", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "ModelService", "ModelService2", "$stateParams", "$state", "$uibModalInstance",
	function ($scope, $http, prismSessionInfo, Preferences, authService, $uibModal, NotificationService, LoadingScreen, RS, $window, ModelService, ModelService2, $stateParams, $state, $uibModalInstance) {
		'use strict';

		$scope.activePosFlag = 2;
		$scope.posFlags = [];
		$scope.currentPosFlagOption = null;

		var session = JSON.parse(sessionStorage.getItem('session'));

		$http.get('v1/rest/posflag?cols=sid,row_version,required,flag_no,name,option.*&filter=(subsidiary_sid,eq,'+session.subsidiarysid+')',{headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(posflags){
			$.each(posflags.data, (key, posFlag) => {

				if ($scope.activePosFlag == posFlag.flag_no) {

					var opts = posFlag.options.sort(function(a, b) {
						var dateA = new Date(a.created_datetime);
						var dateB = new Date(b.created_datetime);
						return dateA - dateB;
					});

					$.each(posFlag.options, (key2, option) => {
						if (option.is_active) {
							$scope.posFlags.push(option);
						}
					});
				}
			});
		});

		$scope.savePosFlag = function(type) {
    		// if (!$scope.currentPosFlagOption) {
    		// 	NotificationService.addAlert('Please select an order type first.', 'Error');	
    		// 	return;
    		// }

			if (type == 'Delivery') {

				var modalOptions = {
				    backdrop: 'static',
				    size: 'md',
				    templateUrl: '/plugins/PLQTS/views/deliveryTypesModal.htm',
				    controller: 'deliveryTypesCtrl',
				    keyboard: false
				};

				$uibModal.open(modalOptions);

			} else {
				LoadingScreen.Enable = 1;

	    		var docSid = $stateParams.document_sid;

	    		ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(documents) {
	    			var doc = documents[0];

	    			var session = JSON.parse(sessionStorage.getItem('session'));

	    			doc.price_lvl = session.preferences.default_price_level;
	    			doc['pos_flag' + $scope.activePosFlag] = type;
	    			doc.save().then(() => {
	    				var params = [
							{
								"Params": {
									"documentsid": docSid
								},
								"MethodName": "DocumentPriceLevelChangeApply"
							}
						];
	    				$http.post('v1/rpc',params).then((res) => {
	    					LoadingScreen.Enable = 0;
		    				$state.go($state.current, {}, {reload: true});
		    				$uibModalInstance.dismiss('cancel');
	    				});
	    				
	    			});
	    		});
			}
    	}
	}
];

prismApp.controller('posFlagCtrl', posFlagCtrl);