var withholdingTaxCtrl = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$filter",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $filter) {
		'use strict';
	
	$scope.isWTaxEnabled = config_enable_auto_compute_wtax;

	$scope.takeWTax = function() {

		if (config_enable_auto_compute_wtax) {

			var docSid = $stateParams.document_sid;

			ModelService.get('Tender', {document_sid:docSid}).then((tenders) => {

				var isCreated = false;

				for (var i = 0; i < tenders.length; i++) {

					var tender = tenders[i];

					if (tender.tender_name == 'Withholding Tax') {
						isCreated = true;
					}

				}

				if (!isCreated) {

					var modalOptions = {
			            backdrop: 'static',
			            size: 'md', // sm, md, lg
			            templateUrl: '/plugins/PLTax/modal.htm',
			            controller: 'wtaxModalCtrl',
			            keyboard: false
			        };
			        
			        $uibModal.open(modalOptions);

				} else {
					RN.showError('Error', 'Withholding tax has already been applied.');
					LoadingScreen.Enable = 0;
				}

			
			});
			
		}

	}

}];

window.angular.module('withholdingTaxCtrl', ['ui.bootstrap', 'angularUtils.directives.dirPagination', 'customDirectives'])
   .controller('withholdingTaxCtrl', withholdingTaxCtrl)