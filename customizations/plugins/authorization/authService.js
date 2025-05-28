prismApp.factory('authService', ["$http", "$uibModal", "ResourceNotificationService", "NotificationService", "LoadingScreen",
		function($http, $uibModal, RS, NotificationService, LoadingScreen) {

	this.checkLicense = function(){
		return new Promise(function(resolve){
			$http.get('plugins/authorization/auth_service.php?action=check_license').then(function(response){
				var resData = JSON.parse(response.data);
				var retArray = [];

				sessionStorage.setItem('isLicensedChecked', false);

				sessionStorage.setItem('isFullLicense', resData.isFullLicense);
				sessionStorage.setItem('systemName', resData.systemName);
				sessionStorage.setItem('systemVersion', resData.systemVersion);
				sessionStorage.setItem('machineID', resData.machineID);

				if(resData.status_code == 1 && resData.isFullLicense == 'TRUE')
				{
					retArray['isLicensedChecked'] 	= false;
					retArray['isFullLicense'] 		= resData.isFullLicense;
					retArray['isTrial'] 			= false;
					retArray['note'] 				= '';

					sessionStorage.setItem('isTrial', false);

					resolve(true);
				}
				else if(resData.status_code == 1 && resData.isFullLicense == 'FALSE')
				{
					retArray['isLicensedChecked'] 	= false;
					retArray['isFullLicense'] 		= resData.isFullLicense;
					retArray['isTrial'] 			= true;
					retArray['note'] 				= 'Please be reminded that you are using a trial license for this application and will expire on ' + resData.trialExpiry;
					
					sessionStorage.setItem('isTrial', true);

					resolve(true);
				}
				else if(resData.status_code == 0 && resData.isFullLicense == 'FALSE')
				{
					retArray['isLicensedChecked'] 	= false;
					retArray['isFullLicense'] 		= resData.isFullLicense;
					retArray['isTrial']				= false;
					retArray['note'] 				= resData.systemNote;
					retArray['systemName'] 			= resData.systemName;
					retArray['systemVersion'] 		= resData.systemVersion;
					retArray['machineID'] 			= resData.machineID;

					sessionStorage.setItem('isTrial', false);

					var modalOptions = {
					    backdrop: 'static',
					    size: 'md',
					    templateUrl: '/plugins/authorization/license_page.htm',
					    controller: 'authorization_ctrl',
					    keyboard: false,
					    controller: function($scope, $uibModalInstance) {

					    	$scope.licenseKey = '';

					    	$scope.isTrial 				= false;
							$scope.isLicensedChecked 	= false;
							$scope.isFullLicense 		= resData.isFullLicense;
							$scope.systemNote 			= resData.systemNote;

							$scope.systemName 		= resData.systemName;
							$scope.systemVersion 	= resData.systemVersion;
							$scope.machineID 		= resData.machineID;
							$scope.licenseKey 		= null;

					    	$scope.close = function() {
					    		$uibModalInstance.dismiss('cancel');
					    		RS.showWarning('Warning:', 'Unable to use customized plugin. License is required!');
					    		resolve(false);
					    	}

					    	$scope.validateLicense = function()
							{
								LoadingScreen.Enable = 1;
								if($scope.licenseKey == '' || $scope.licenseKey == null)
								{
									LoadingScreen.Enable = 0;
									NotificationService.addAlert('Please enter a valid license key!', 'License Details Validation', 'static', false);
								}
								else
								{
									validateLicense($scope.systemName, $scope.systemVersion, $scope.machineID, $scope.licenseKey).then(function(response){
										
										if (/^[\],:{}\s]*$/.test(response.data.replace(/\\["\\\/bfnrtu]/g, '@').
											replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
											replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

											var jsonData = JSON.parse(response.data);
											LoadingScreen.Enable = 0;
											if(jsonData.status_code == 200)
											{
												NotificationService.addAlert(jsonData.status_message, 'License Accepted', 'static', false).then(function(){
													$uibModalInstance.dismiss('cancel');
													resolve(true);
												});
											}
											else
											{
												RS.showError('Invalid License', jsonData.status_message);
											}
										} else {
											LoadingScreen.Enable = 0;
											RS.showError('Error', 'Invalid License Key!');
										}
									});
								}
							};
					    }
					};
					$uibModal.open(modalOptions);
				}
			});
		});
	};

	function validateLicense(systemName, systemVersion, machineID, licenseKey){
		return new Promise(function(resolve){
			$http.post('plugins/authorization/auth_service.php', {action: 'validate_license', systemName: systemName, systemVersion: systemVersion, machineID: machineID, licenseKey: licenseKey}).then(function(response){
				resolve(response);
			});
		});
	};

	return this;
	
}]);