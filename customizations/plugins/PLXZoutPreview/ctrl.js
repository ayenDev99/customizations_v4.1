var xzOut = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModalInstance", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$filter",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModalInstance, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $filter) {
		'use strict';

		$scope.closeModalDialog = function(){
		   $uibModalInstance.dismiss();
		   $state.go($state.current, {}, {reload: true});
        };


        $scope.print = function() {
        	LoadingScreen.Enable = 1;

		    var params = {
				action: 'printXOutZOut',
				port: $window.location.port,
				data: globalSortableXZoutPrintInfo
	    	};

		    $http.post('plugins/eJournal/ejournal.php', params).then(function(result) {
	        	LoadingScreen.Enable = 0;
	        }, (err) => {
	        	LoadingScreen.Enable = 0;
	        });
        };

        $scope.export = function() {
        	// LoadingScreen.Enable = 1;
	    
	    	var params = {
				action: 'generate',
				port: $window.location.port,
				data: globalSortableXZoutPrintInfo
	    	};

	    	$http.post('plugins/PLXZoutPreview/XZOutPDF.php', params).then(function(result) {
	    		// var res = JSON.parse(result);
	        	window.open('/plugins/PLXZoutPreview/xzout.pdf');
	        	// LoadingScreen.Enable = 0;
	        }, (err) => {
	        	// LoadingScreen.Enable = 0;
	        });
        };

}];


window.angular.module('xzOutCtrl', ['ui.bootstrap', 'customDirectives'])
   .controller('xzOutCtrl', xzOut)
   .config(function(paginationTemplateProvider, $windowProvider) {
   		

});