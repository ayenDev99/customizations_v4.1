var birReports = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModalInstance", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$filter",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModalInstance, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $filter) {
		'use strict';
		var sess 								= $http.defaults.headers.common['Auth-Session'];
		var servername 							= $window.location.origin;
        $scope.filtersOn   						= true;
		$scope.salesReport 						= {};
        $scope.salesReport.dateFrom 			= $filter('date')(new Date(),'yyyy-MM-dd');
        $scope.salesReport.dateTo	    		= $filter('date')(new Date(),'yyyy-MM-dd');
		$scope.salesReport.report_type 			= '';
		$scope.salesReport.current_report_type 	= '';
		$scope.searchResult						= {};
		$scope.searchResult.results				= [];
		$scope.searchResult.recordCount			= 0;
		$scope.searchResult.minzcount			= 0;
		$scope.searchResult.zcount				= 0;
		$scope.salesReport.reportTitle 			= 'Search Results';
		$scope.salesReport.itemsPerPage			= 10;
		$scope.salesReport.workstation			= {'sid': 'all', 'workstation_name': 'All'};
		$scope.salesReport.workstation_list		= {};
		$scope.salesReport.all_workstation_no	= null;
		$scope.salesReport.cashier				= {'sid': 'all', 'emplname': 'All'};
		$scope.salesReport.cashier_list			= {};

		ModelService.get('Workstation').then(function(data) {

			var session = prismSessionInfo.get();

			var tempData = [
				{
					'sid': 'all',
					'workstation_name': 'All'
				}
			];
			tempData = tempData.concat(data);
		  	$scope.salesReport.workstation_list = tempData;

		  	var temp = [];
		  	for (var i = 0; i < data.length; i++) {
		  		if (data[i].workstation_number != "") {
		  			temp.push(data[i].workstation_number);
		  		}
		  	}
		  	$scope.salesReport.all_workstation_no = temp.join();

		  	$scope.salesReport.workstation = {
		  		'sid': session.workstationid,
				'workstation_name': session.workstation
		  	}

		});

		ModelService2.get('Employee').then(function(data) {
			var tempData = [
				{
					'sid': 'all',
					'emplname': 'All'
				}
			];
			tempData = tempData.concat(data);
		  	$scope.salesReport.cashier_list = tempData;
		});

		// Function called when changing page number
		$scope.pageChanged = function(newPage) {
		    $scope.displayReport(newPage);
		};


        // Function for triggering filter display to hide or show
        $scope.toggleFilters = function(){
			if($scope.filtersOn)
			{
				$scope.filtersOn = false;
			}
			else
			{
				$scope.filtersOn = true;
			}
        };

        // Function to close a current modal dialog opened
        $scope.closeModalDialog = function(){
		   $uibModalInstance.dismiss();
		   $state.go($state.current, {}, {reload: true});
        };

        // Function to clear filters data
        $scope.resetSearchFilters = function(){
            $scope.salesReport.dateFrom = $filter('date')(new Date(),'yyyy-MM-dd');
            $scope.salesReport.dateTo	= $filter('date')(new Date(),'yyyy-MM-dd');
			$scope.salesReport.report_type = '';
			$scope.salesReport.current_report_type = '';
			$scope.searchResult	= {};
			$scope.searchResult.results	= [];
			$scope.searchResult.recordCount	= 0;
			$scope.salesReport.reportTitle = 'Search Results';
        };

        $scope.clear = function () {
			$scope.salesReport.current_report_type = '';
			$scope.searchResult	= {};
			$scope.searchResult.results	= [];
			$scope.searchResult.recordCount	= 0;
			$scope.salesReport.reportTitle = 'Search Results';
        }

		// Function to display Reports
		$scope.displayReport = function(pageNumber) {

			var session = prismSessionInfo.get();

			$('table#tbl_report tr:not(.tr-head)').remove();
			$scope.salesReport.current_report_type = $scope.salesReport.report_type;

			switch ($scope.salesReport.current_report_type) {
				case 'SALES_SUMMARY':
					$scope.salesReport.reportTitle = 'BIR Sales Summary Report';
					break;
				case 'DETAILED_SUMMARY':
					$scope.salesReport.reportTitle = 'Detailed Sales Summary Report';
					break;
				case 'RETURN_REPORT':
					$scope.salesReport.reportTitle = 'Return Report';
					break;
				case 'SENIOR_CITIZENS_DISCOUNT':
					$scope.salesReport.reportTitle = 'Senior Citizen Sales Book/Report';
					break;
				case 'PWD_DISCOUNT':
					$scope.salesReport.reportTitle = 'Persons with Disability Sales Book/Report';
					break;
				case 'SP_DISCOUNT':
					$scope.salesReport.reportTitle = 'Solo Parent Sales Book/Report';
					break;
				case 'ATHELETE_DISCOUNT':
					$scope.salesReport.reportTitle = 'National Athletes and Coaches Sales Book/Report';
					break;
				case 'ZERO_RATED_SALES':
					$scope.salesReport.reportTitle = 'Zero Rated Sales Report';
					break;
				default:
					$scope.salesReport.reportTitle = 'Search Results';
			}

			$http.post('/plugins/PLBIRReports/birReports.php', {
				action: 'searchResult',
				reportType: $scope.salesReport.current_report_type,
				currentPage: pageNumber,
				itemsPerPage: $scope.salesReport.itemsPerPage,
				fromDate: $scope.salesReport.dateFrom,
				toDate: $scope.salesReport.dateTo,
				workstation: $scope.salesReport.workstation.sid,
				cashier: $scope.salesReport.cashier.sid,
				netRoundingOff: config_isNetAmountRoundingOffEnabled,
				config_settingsVersion: config_settingsVersion_reports,
				store: session.storesid
			}).then(function(data){
				if (data.data != '') {
				    var resultData = JSON.parse(data.data);

				    $('table#tbl_report tr:not(.tr-head)').remove();
				    
				    $scope.searchResult.results = resultData.results;
					$scope.searchResult.recordCount = resultData.total;
					// console.log(resultData);

					for (var i = 0; i < $scope.searchResult.results.length; i++) {
						if (typeof $scope.searchResult.results[i].ZCOUNT_SEQUENCE != 'undefined') {
							// var minzcount = parseInt($scope.searchResult.results[i].MIN_ZCOUNTER);
							// var zcount = parseInt($scope.searchResult.results[i].ZCOUNTER);

							// var zcounters = "";
							// if (minzcount == 0 || minzcount	== zcount) {
							// 	zcounters = zcount;
							// } else {
							// 	minzcount += 1;
							// 	// zcount += 1;
							// 	while (minzcount != zcount + 1) {
							// 		zcounters = zcounters + minzcount;
									
							// 		if (minzcount + 1 != zcount + 1) {
							// 			zcounters = zcounters + ',';
							// 		}

							// 		minzcount++;
							// 	}
							// }

							// $scope.searchResult.results[i].ZCOUNTERS = zcounters;

							$scope.searchResult.results[i].ZCOUNTERS = $scope.searchResult.results[i].ZCOUNT_SEQUENCE;
						}
					}

					setTimeout(() => {
						if (!config_isNetAmountRoundingOffEnabled) {
							$('.net_rounding_off').remove();
						}
					}, 500);

				}
			});
		};

		$scope.exportReport = function() {
			var session = JSON.parse(sessionStorage.getItem('session'));
			var versionInfo = JSON.parse(sessionStorage.getItem('VersionInfo'));

			var username = session.username;
			var softwareVersion = versionInfo.VerProduct + " v" + versionInfo.VerMajor;
			var storeSID = session.storesid;
			var storeNo = session.storenumber;
			var sbsSID = session.subsidiarysid;
			var sbsNo = session.subsidiarynumber;
			var wsNo = session.workstationnumber;
			var workstation = $scope.salesReport.workstation.sid;
			var cashier = $scope.salesReport.cashier.sid;
			var allWorkstationNo = $scope.salesReport.all_workstation_no;

			if (workstation == 'all') {

				window.open(servername + '/plugins/PLBIRReports/birReports.php?action=export&reportType=' + $scope.salesReport.report_type + 
						'&fromDate=' + $scope.salesReport.dateFrom + 
						'&toDate=' + $scope.salesReport.dateTo +
						'&username=' + username +
						'&softwareVersion=' + softwareVersion +
						'&storeSID=' + storeSID +
						'&store=' + storeSID +
						'&storeNo=' + storeNo +
						'&sbsSID=' + sbsSID +
						'&sbsNo=' + sbsNo +
						'&wsNo=' + wsNo +
						'&workstation=' + workstation +
						'&cashier=' + cashier +
						'&allWorkstationNo=' + allWorkstationNo +
						'&config_settingsVersion=' + config_settingsVersion_reports +
						'&netRoundingOff=' + config_isNetAmountRoundingOffEnabled);

			} else {
				ModelService.get('Workstation', { sid: workstation }).then(function(wsData) {
					window.open(servername + '/plugins/PLBIRReports/birReports.php?action=export&reportType=' + $scope.salesReport.report_type + 
						'&fromDate=' + $scope.salesReport.dateFrom + 
						'&toDate=' + $scope.salesReport.dateTo +
						'&username=' + username +
						'&softwareVersion=' + softwareVersion +
						'&storeSID=' + storeSID +
						'&store=' + storeSID +
						'&storeNo=' + storeNo +
						'&sbsSID=' + sbsSID +
						'&sbsNo=' + sbsNo +
						'&wsNo=' + wsData[0].workstation_number +
						'&workstation=' + workstation +
						'&cashier=' + cashier +
						'&allWorkstationNo=' + allWorkstationNo +
						'&config_settingsVersion=' + config_settingsVersion_reports +
						'&netRoundingOff=' + config_isNetAmountRoundingOffEnabled);
			});
			}
		};
}];

window.angular.module('birReportsCtrl', ['ui.bootstrap', 'angularUtils.directives.dirPagination', 'customDirectives'])
   .controller('birReportsCtrl', birReports)
   .config(function(paginationTemplateProvider, $windowProvider) {
   		var $window = $windowProvider.$get();
    	paginationTemplateProvider.setPath($window.location.origin + '/plugins/templates/pagination/dirPagination.tpl.html');
   });

 app.controller('ModalHeaderSettingsCtrl', function($http, $scope, $uibModalInstance) {

	$scope.submit = function(e){
		$http.post('/plugins/PLBIRReports/header-settings.php', {
			action: 'save',
			data: $('#form-header-settings').serializeArray()
		}).then(function(response) {
			var data = JSON.parse(response.data);
			if (typeof data.success != 'undefined') {
				$uibModalInstance.close("Ok");
			} else {
				alert('There\'s an error saving the settings. Please reload the page and try again.');
			}
		});
	}
   
  $scope.cancel = function(){
    $uibModalInstance.dismiss();
  } 
  
});