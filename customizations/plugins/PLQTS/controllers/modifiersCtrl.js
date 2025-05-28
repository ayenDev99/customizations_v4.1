var modifiersCtrl = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$filter", "$element", "$timeout",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $filter, $element, $timeout) {
		'use strict';

		$scope.itemSid = null

		$scope.modifier1Options = [];
		if (typeof modifiers1Options !== 'undefined') {
			$scope.modifier1Options = modifiers1Options;
		}

		$scope.modifier2Options = [];
		if (typeof modifiers2Options !== 'undefined') {
			$scope.modifier2Options = modifiers2Options;
		}

		$scope.modifier1Value = null;
		$scope.modifier2Value = null;
		$scope.modifier3Value = null;

		var docSid = $stateParams.document_sid;

		var delayTimeout;

		jQuery(document).ready(function(e) {
			$scope.itemSid = $element.find('.item-sid').val();

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
		});

		// $scope.saveModifier = function(modifierNo, delay) {
		// 	if (delay === 'instant') {
		// 		$scope.saveModifierCallback(modifierNo);
		// 	} else {
		// 		if (delayTimeout) {
		// 			$timeout.cancel(delayTimeout);
		// 	    }

		// 	    delayTimeout = $timeout(function() {
		// 	    	$scope.saveModifierCallback(modifierNo);
		// 	    }, (delay * 1000));
		// 	}
		// }

		// $scope.saveModifierCallback = function(modifierNo) {

		// 	ModelService.get('Item', {document_sid: docSid, sid: $scope.itemSid, cols:'*'}).then(function(items) {
		// 		var item = items[0];

		// 		var noteNo = null;
		// 		if (modifierNo == 1) {
		// 			noteNo = modifier1NoteNo;
		// 		}
		// 		if (modifierNo == 2) {
		// 			noteNo = modifier2NoteNo;
		// 		}
		// 		if (modifierNo == 3) {
		// 			noteNo = modifier3NoteNo;
		// 		}

		// 		if (noteNo) {
		// 			if ($scope['modifier'+modifierNo+'Value']) {
		// 				item['note' + noteNo] = $scope['modifier'+modifierNo+'Value'];
		// 			}
		// 			item.save().then(() => {
		// 				RN.showSuccessfulMessage('Success', 'Modifier #' + modifierNo + ' has been successfully saved.');
		// 				$state.go($state.current, {}, {reload: true});
		// 			});
		// 		}
		// 	});
		// }
	}
];

window.angular.module('modifiersCtrl', [])
	.controller('modifiersCtrl', modifiersCtrl);