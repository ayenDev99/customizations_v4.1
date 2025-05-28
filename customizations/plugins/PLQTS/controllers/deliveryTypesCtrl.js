var deliveryTypesCtrl = ["$scope", "$http", "prismSessionInfo", "Preferences", "authService", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "ModelService", "ModelService2", "$stateParams", "$state", "$uibModalInstance", "$uibModalStack",
	function ($scope, $http, prismSessionInfo, Preferences, authService, $uibModal, NotificationService, LoadingScreen, RS, $window, ModelService, ModelService2, $stateParams, $state, $uibModalInstance, $uibModalStack) {
		'use strict';

		$scope.activePosFlag = 2;
		$scope.deliveryTypes = [];

		for (var i = 0; i < qts_delivery_tansaction_types.length; i++) {
			var type = qts_delivery_tansaction_types[i].split('-');

			$scope.deliveryTypes.push({
				'name': type[0],
				'price_level': type[1]
			});
		}

		$scope.close = function() {
			$uibModalInstance.dismiss('cancel');
		}

		$scope.savePosFlag = function(price_lvl) {

			LoadingScreen.Enable = 1;

    		var docSid = $stateParams.document_sid;

    		ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(documents) {
    			var doc = documents[0];

    			doc.price_lvl = price_lvl;
    			doc['pos_flag' + $scope.activePosFlag] = 'Delivery';
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
	    				var top = $uibModalStack.getTop();
				        while (top) {
				            $uibModalStack.dismiss(top.key);
				            top = $uibModalStack.getTop();
				        }
    				});
    				
    				
    			});
    		});
		}

	}
];

prismApp.controller('deliveryTypesCtrl', deliveryTypesCtrl);