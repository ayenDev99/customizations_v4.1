var specialDiscountCtrl = ["$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModal", "$state","$q","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService", "$filter",
	function($scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModal, $state, $q, $window, RN, LoadingScreen, NotificationService, $filter) {
		'use strict';
	
	$scope.isSpecialDiscountsEnabled = config_enable_special_discounts;

	$scope.specialDiscount = function(test = false) {
	
		if (!$('#itemLookup').is(':focus')) {
		
			var docSid = $stateParams.document_sid;

			ModelService.get('Document', {sid: docSid}).then((docs) => {
				var doc = docs[0];

				ModelService.get('Item', {document_sid: docSid}).then((items) => {

					if (!items.length) {
						RN.showError('Error', 'Please select an item first.');
					} else {

						// if ((!doc.bt_cuid && config_special_discount_process_type == 'pharma') || (!doc.bt_cuid && config_special_discount_process_type == 'default')) {
						// 	RN.showError('Error', 'Please select a customer first.');
						// } else {

							var itemsLen = items.length;

							var passed = true;

							// items.forEachWithCallback((el, i, next) => {
							// 	ModelService.get('Inventory', {sid: el.invn_sbs_item_sid}).then((invns) => {
							// 		var codes = 'SP,NAC,SCPWD,SCPWDNAC,SCPWDSP,NACSP,ALL';
							// 		codes = codes.split(',');

							// 		var allCodesPassed = false;
							// 		for (var x = 0; x < codes.length; x++) {
	                        //             if (codes[x] == el.dcs_code.replace(/ /g,'')) {
	                        //             	allCodesPassed = true;
	                        //             }
	                        //         }

	                        //         if (!allCodesPassed) {
	                        //         	passed = false;
	                        //         }


	                        //         if (itemsLen == i) {
	                        //         	if (passed) {

	                        //         		$state.go($state.current, {}, {reload: true});

											var modalOptions = {
									            backdrop: 'static',
									            size: 'md', // sm, md, lg
									            templateUrl: '/plugins/PLSpecialDiscounts/modal.htm',
									            controller: 'specialDiscountModalCtrl',
									            keyboard: false
									        };
									        
									        $uibModal.open(modalOptions);
	                                		
	                        //         	} else {
	                        //         		RN.showError('Error', 'Unable to use special discount. There is item that is not tagged in any special discount.');
	                        //         	}

					        //         } else {
					        //         	next();
					        //         }
							// 	});
							// });

						// }
					}

				});
			});
		}
	}
}];

window.angular.module('specialDiscountCtrl', [])
	.controller('specialDiscountCtrl', specialDiscountCtrl);


// var isCustomerRemoved = false;

// Copy notes general from return receipt to the current transaction
// var PLSpecialDiscountDocumentHandler = ['ModelEvent', 'ModelService', 'authService', '$uibModal', function(ModelEvent, ModelService, authService, $uibModal){

//     // Event handler to capture after item insert in the current document
//     var afterDocSave= function($q, doc) {
//     	var deferred = $q.defer();
//     	if (isCustomerRemoved) {
    		
//     		LoadingScreen.Enable = 1;

//     		isCustomerRemoved = false;
//     	} else {
//     		deferred.resolve();
//     	}
        
        
//         return deferred.promise;
//     };

//     ModelEvent.addListener('document', 'onBeforeSave', afterDocSave);
// }]

// ConfigurationManager.addHandler(PLSpecialDiscountDocumentHandler);


// // Modifiers
ButtonHooksManager.addHandler(['after_posTransactionRemoveCustome'],
    function($q, $state, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, LoadingScreen) {
  	  	var deferred = $q.defer();
  	  	
  	  	LoadingScreen.Enable = 1;

  	  	ModelService.get('Document', {sid: $stateParams.document_sid}).then((docs) => {
  	  		var doc = docs[0];

  	  		doc.detax_flag = false;

  	  		doc.save().then(() => {

				ModelService.get('Item', {document_sid: doc.sid}).then((items) => {
					deleteItemDiscounts(items, $http, $state).then(() => {
						deleteDocCoupons(doc.coupons, $http, $state).then(() => {
							LoadingScreen.Enable = 0
            				$state.go($state.current, {}, {reload: true});
						});
					});
				});

			});
  	  	});


  	  	return deferred.promise;
    }
);

function deleteItemDiscounts(items, $http, $state) {
	return new Promise((resolve) => {
		var itemsLen = items.length;

		if (!itemsLen) {
			resolve(true);
		}

		items.forEachWithCallback((el, i, next) => {

			var discLength = el.discounts.length;

            if (!discLength) {
            	if (i == itemsLen) {
            		resolve(true);
            	} else {
            		next();
            	}
            } else {
            	el.discounts.forEachWithCallback((el2, i2, next2) => {

	                $http.delete(el2.link + '?cols=*').then((res) => {
	                   
	                    if (i2 == discLength) {
	                        if (i == itemsLen) {
	                        	resolve(true);
			            	} else {
			            		next();
			            	}
	                    } else {
	                    	next2();
	                    }
	                }, () => {
	                	if (i2 == discLength) {
	                        if (i == itemsLen) {
	                        	resolve(true);
			            	} else {
			            		next();
			            	}
	                    } else {
	                    	next2();
	                    }
	                });
	            
	            });
            }
    	});
    });
}
function deleteDocCoupons(coupons, $http, $state) {

	return new Promise((resolve) => {
		var couponsLen = coupons.length;

		if (!couponsLen) {
			resolve(true);
		}

		console.log(coupons);
		coupons.forEachWithCallback((el, i, next) => {

			$http.delete(el.link + '?cols=*').then((res) => {
	                   
                if (i == couponsLen) {
                	resolve(true);
            	} else {
            		next();
            	}
           
            }, () => {
            	if (i == couponsLen) {
                	resolve(true);
            	} else {
            		next();
            	}
            });

    	});
    });
}


ButtonHooksManager.addHandler(['before_posSearchTransactionsSearch',],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo) {
        var deferred = $q.defer();
        $rootScope.$$childTail.$$prevSibling.pendingTransactions = null;
        deferred.resolve();
        return deferred.promise;
    }
);

ButtonHooksManager.addHandler(['after_posSearchTransactionsSearch',],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo) {
        var deferred = $q.defer();
        var ps = $rootScope.$$childTail.$$prevSibling;
        
        var fields = ps.fields;
        var interval = setInterval(() => { 
        	console.log('interval');
        	var pt = ps.pendingTransactions;
        	console.log(pt);
        	if (pt) {
        		clearInterval(interval);
        		if (pt.length) {
		            var p = pt[0]
		            var params = p.params;

		            var filter = params.filter;
		            var page_no = params.page_no;
		            var page_size = params.page_size;
		            var cols = params.cols + ',tracking_number';
		             
		            ModelService.get('Document', {cols: cols, filter: filter, sort: "invoice_posted_date,desc", page_no: page_no, page_size: page_size}).then(function(docs) {
		            	console.log(docs);
		                
	                    $rootScope.$applyAsync(function() {
	                        $rootScope.$$childTail.$$prevSibling.pendingTransactions = docs;
	                    });
	                
		            });
		        }

        	}
	        
        }, 1000);

        deferred.resolve();
        return deferred.promise;
    }
);