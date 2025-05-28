var hotkeyCtrl = ["$scope", "$http", "prismSessionInfo", "Preferences", "authService", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "$uibModalInstance", "$state",
	function ($scope, $http, prismSessionInfo, Preferences, authService, $uibModal, NotificationService, LoadingScreen, RS, $window, $uibModalInstance, $state) {
		'use strict';
		
		$scope.hotkeys = [];

		$scope.formData = {};

		$(document).on('keydown', '#hotkeysModal .keys .key input', function(e) {
			e.stopPropagation();
			e.preventDefault();

			var label = [];
			if (e.ctrlKey) {
				label.push('Ctrl');
			}
			if (e.altKey) {
				label.push('Alt');
			}
			if (e.shiftKey) {
				label.push('Shift');
			}
			if (e.metaKey) {
				label.push('Meta');
			}

			if (e.key != "Control" && e.key != "Alt" && e.key != "Shift" && e.key != "Meta"){
				label.push(e.originalEvent.code);
			}

			var path = $(this).closest('.path');
			var dataPathKey = path.attr('data-path-key');
			var keycode = $(this).siblings('.keycode');
			var ctrlKey = $(this).siblings('.ctrlKey');
			var altKey = $(this).siblings('.altKey');
			var shiftKey = $(this).siblings('.shiftKey');
			var metaKey = $(this).siblings('.metaKey');

			getHotkeysKeys().then((hotkeys) => {
				// console.log(hotkeys);
				var duplicatePaths = [];
				var canProceed = true;
				if (dataPathKey == 'general') {
					$.each(hotkeys, (index,value) => {
						if (value.keycode == e.which) {
							if (String(e.ctrlKey).toLowerCase() == value.ctrlKey && String(e.altKey).toLowerCase() == value.altKey && String(e.shiftKey).toLowerCase() == value.shiftKey && String(e.metaKey).toLowerCase() == value.metaKey) {
								canProceed = false;
								duplicatePaths.push(value.pathLabel + "(" + value.keyLabel + ")");
							}
						}
					});
				} else {
					$.each(hotkeys, (index,value) => {
						if (value.keycode == e.which && (value.path==dataPathKey || value.path=="general")) {
							if (String(e.ctrlKey).toLowerCase() == value.ctrlKey && String(e.altKey).toLowerCase() == value.altKey && String(e.shiftKey).toLowerCase() == value.shiftKey && String(e.metaKey).toLowerCase() == value.metaKey) {
								canProceed = false;
								duplicatePaths.push(value.pathLabel + "(" + value.keyLabel + ")");
							}
						}
					});
				}

				if (canProceed) {

					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].keylabel = label.join('+');
					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].keycode = e.which;
					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].ctrlKey = e.ctrlKey;
					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].altKey = e.altKey;
					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].shiftKey = e.shiftKey;
					$scope.hotkeys[$(this).attr('data-path-key')].paths[$(this).attr('data-subpath-key')].keys[$(this).attr('data-key-key')].metaKey = e.metaKey;
					$scope.$apply(function() {
						assignValue($scope.hotkeys);
					});
					// $(this).val(label.join('+'));
					// keycode.val(e.which);
					// ctrlKey.val(e.ctrlKey);
					// altKey.val(e.altKey);
					// shiftKey.val(e.shiftKey);
					// metaKey.val(e.metaKey);
				} else {
					if (duplicatePaths.length && !$('form#Notifications').length) {
						NotificationService.addAlert('Has duplicate in ' + duplicatePaths.join(' & '), 'Error');
					}
				}
			});

			
		});

		$.ajax({
			url: 'plugins/PLHotkeys/hotkeys.json',
			dataType: 'json',
			success: function(data) {
				$scope.$apply(function() {
					assignValue(data);
				});
			},
			error: function(xhr, status, error) {
				// An error occurred while retrieving the JSON file
				console.log('Error:', error);
			}
		});

		$scope.closeModal = function() {
			$uibModalInstance.dismiss('cancel'); // Close the modal
		};

		// Function to assign the value
		function assignValue(data) {
			$scope.hotkeys = data;
		}


// function onChange() {
//   console.log('Change');
//   if (!$scope.$$phase) {
//     $scope.$apply();
//   }
// }
// $scope.$watch('hotkeys', function(newValue, oldValue) {
//     console.log('test');
//   }, true);

		function getHotkeysKeys() {
			return new Promise((resolve) => {
				var hotkeysKeys = [];

				var keys = $('#hotkeysModal .keys tr.key');

				keys.each((index, value) => {
					var keycode = $(value).find('.keycode');
					var ctrlKey = $(value).find('.ctrlKey');
					var altKey = $(value).find('.altKey');
					var shiftKey = $(value).find('.shiftKey');
					var metaKey = $(value).find('.metaKey');

					hotkeysKeys.push({
						"keycode": parseInt(keycode.val()),
						"ctrlKey": ctrlKey.val(),
						"altKey": altKey.val(),
						"shiftKey": shiftKey.val(),
						"metaKey": metaKey.val(),
						"path": $(value).attr('data-path'),
						"pathLabel": $(value).attr('data-path-label'),
						"subpathLabel": $(value).attr('data-subpath-label'),
						"keyLabel": $(value).attr('data-key-label')
					})
				});

				


				// for (var prop in $scope.hotkeys) {
    //                 if ($scope.hotkeys.hasOwnProperty(prop)) {
    //                     var paths = $scope.hotkeys[prop].paths;
    //                     for (var i = 0; i < paths.length; i++) {
	   //                      var keys = paths[i].keys;
	   //                      $.each(keys, (index, value) => {
	   //                      	value.path = prop;
	   //                      	value.pathLabel = $scope.hotkeys[prop].label;
	   //                      	hotkeysKeys.push(value);
	   //                      });
	   //                  }
    //                 }
    //             }
                resolve(hotkeysKeys);
			});

		}

		$scope.revert = function() {
			
			$.ajax({
				url: 'plugins/PLHotkeys/hotkeys.json',
				dataType: 'json',
				success: function(data) {
					$scope.$apply(function() {
						assignValue(data);
					});
					// You can process the data here
				},
				error: function(xhr, status, error) {
					// An error occurred while retrieving the JSON file
					console.log('Error:', error);
				}
			});
		}

		$scope.default = function() {
			
			$.ajax({
				url: 'plugins/PLHotkeys/hotkeys_default.json',
				dataType: 'json',
				success: function(data) {
					$scope.$apply(function() {
						assignValue(data);
					});
					// You can process the data here
				},
				error: function(xhr, status, error) {
					// An error occurred while retrieving the JSON file
					console.log('Error:', error);
				}
			});
		}

		$scope.save = function() {
			
			$http.post('plugins/PLHotkeys/save_hotkeys.php', $scope.hotkeys)
				.then(function(response) {

					var res = JSON.parse(response.data);
					if (res.success) {
						NotificationService.addAlert(res.message, 'Success').then(() => {
							$uibModalInstance.dismiss('cancel');
							location.reload();
						});
					}
					// console.log('Request successful:', response.data);
					// Handle the response data
			})
			.catch(function(error) {
				console.error('Request error:', error);
				// Handle the error
			});


		}

	}];


window.angular.module('hotkeyCtrl', [])
	.controller('hotkeyCtrl', hotkeyCtrl);