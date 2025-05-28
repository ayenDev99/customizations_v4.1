var modifiersModalCtrl = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "dataItemSid", "$uibModalInstance",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, dataItemSid, $uibModalInstance) {
		'use strict';
	
		$scope.itemSid = dataItemSid;

		$scope.modifier1Options = [];
		$scope.modifier2Options = [];

		$scope.modifier1Value = '';
		$scope.modifier2Value = '';
		$scope.modifier3Value = '';

		var docSid = $stateParams.document_sid;

		var delayTimeout;

		jQuery(document).ready(function(e) {

			ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(documents) {

				var doc = documents[0];

				ModelService.get('Item', {document_sid: docSid, cols:'*'}).then(function(items) {

					$.each(items, (key, val) => {
						if (val.sid == $scope.itemSid) {
							$scope.modifier1Value = val['note' + modifier1Text1NoteNo];
							if (val['note' + modifier1Text2NoteNo] != '') {
								$scope.modifier1Value += "+" + val['note' + modifier1Text2NoteNo];
							}
							$scope.modifier2Value = val['note' + modifier2Text3NoteNo];
							if (val['note' + modifier2Text4NoteNo] != '') {
								$scope.modifier2Value += "+" + val['note' + modifier2Text4NoteNo];
							}
							$scope.modifier3Value = val['note' + modifier3NoteNo];
						}
					});
				});
			});


			ModelService.get('Inventory', {filter:'(alu,eq,'+modifierOptionsAlu+')', cols:'*'}).then(function(invns) {
				var invn = invns[0];

				// Modifier 1
				var text1options = invn.text1.split(',');
				for (var i = 0; i < text1options.length; i++) {
					if ($.inArray(text1options[i], $scope.modifier1Options) === -1) {
						$scope.modifier1Options.push(text1options[i]);
					}
				}
				var text2options = invn.text2.split(',');
				for (var j = 0; j < text2options.length; j++) {
					if ($.inArray(text2options[j], $scope.modifier1Options) === -1) {
						$scope.modifier1Options.push(text2options[j]);
					}
					
				}


				// Modifier 2
				var text3options = invn.text3.split(',');
				for (var k = 0; k < text3options.length; k++) {
					if ($.inArray(text3options[k], $scope.modifier2Options) === -1) {
						$scope.modifier2Options.push(text3options[k]);
					}
					
				}
				var text4options = invn.text4.split(',');
				for (var l = 0; l < text4options.length; l++) {
					if ($.inArray(text4options[l], $scope.modifier2Options) === -1) {
						$scope.modifier2Options.push(text4options[l]);
					}
				}
			});


			
		});

		$scope.closeModal = function() {
			$uibModalInstance.dismiss('cancel'); // Close the modal
		};

		$scope.saveModifier = function(modifierNo, delay) {
			if (delay === 'instant') {
				$scope.saveModifierCallback(modifierNo);
			} else {
				if (delayTimeout) {
					$timeout.cancel(delayTimeout);
			    }

			    delayTimeout = $timeout(function() {
			    	$scope.saveModifierCallback(modifierNo);
			    }, (delay * 1000));
			}
		}

		$scope.saveModifiers = function() {

			LoadingScreen.Enable = 1;

			ModelService.get('Item', {document_sid: docSid, sid: $scope.itemSid, cols:'*'}).then(function(items) {
				var item = items[0];

				var noteNo = null;

				var noteNo1Name = '';
				var noteNo1Price = '';
				var modifier1Values = $scope.modifier1Value.split('+');
				if (modifier1Values.length) {
					noteNo1Name = modifier1Values[0];
					if (modifier1Values.length >= 2) {
						noteNo1Price = modifier1Values[1];
					}
				}

				var noteNo2Name = '';
				var noteNo2Price = '';
				var modifier2Values = $scope.modifier2Value.split('+');
				if (modifier2Values.length) {
					noteNo2Name = modifier2Values[0];
					if (modifier2Values.length >= 2) {
						noteNo2Price = modifier2Values[1];
					}
				}


				var noteNo3 = modifier3NoteNo;

				

				if (noteNo3) {
					if ($scope['modifier3Value']) {
						item['note' + noteNo3] = $scope['modifier3Value'];
					}
				}

				ModelService.get('Pricelevel',{cols:'*', filter: '(price_level,eq,'+modifierPriceLevel+')'}).then(function(data){
					item.price_lvl_sid = data[0].sid;

					item.tax_perc_lock = false;

					var original_price = item.original_price;
					var price = item.price;

					var toSubract = 0;

					if (item['note' + modifier1Text2NoteNo] != '') {
						// original_price = original_price - parseFloat(item['note' + modifier1Text2NoteNo]);
						toSubract += parseFloat(item['note' + modifier1Text2NoteNo]);
					}

					if (item['note' + modifier2Text4NoteNo] != '') {
						// original_price = original_price - parseFloat(item['note' + modifier2Text4NoteNo]);
						toSubract += parseFloat(item['note' + modifier2Text4NoteNo]);
					}

					var toAdd = 0;
					if (noteNo1Price != '') {
						// original_price = original_price + parseFloat(noteNo1Price);
						toAdd += parseFloat(noteNo1Price);
					}
					if (noteNo2Price != '') {
						// original_price = original_price + parseFloat(noteNo2Price);
						toAdd += parseFloat(noteNo2Price);
					}

					console.log(item);
					console.log(toAdd);
					console.log(toSubract);

					item['note' + modifier1Text1NoteNo] = noteNo1Name;
					item['note' + modifier1Text2NoteNo] = noteNo1Price;
					item['note' + modifier2Text3NoteNo] = noteNo2Name;
					item['note' + modifier2Text4NoteNo] = noteNo2Price;
					
					item.original_price = (original_price - toSubract) + toAdd;
					// item.price = (price - toSubract) + toAdd;

					item.save().then(() => {
						// RN.showSuccessfulMessage('Success', 'Modifiers has been successfully saved.');
						LoadingScreen.Enable = 0;
						$uibModalInstance.dismiss('cancel');
						$state.go($state.current, {}, {reload: true});
					});
				});
				
			});
		}
	}
];

prismApp.controller('modifiersModalCtrl', modifiersModalCtrl);