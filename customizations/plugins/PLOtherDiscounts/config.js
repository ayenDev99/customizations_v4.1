var discountCtrl = ['ModelEvent', '$q', 'DocumentPersistedData', 'ResourceNotificationService', '$uibModal', 'Templates', 'ModelService', '$rootScope', 'HookEvent', '$stateParams', 'base64', '$http', 'prismSessionInfo', 'authService', 'LoadingScreen', '$location',
	function(ModelEvent, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, LoadingScreen, $location) {

   	var handlerDocumentBefore = function($q, document){
        var d = $q.defer();
        

        if (config_enable_other_discount_markfoc && document.manual_disc_reason == 'MARKFOC') {

        	var discValue = document.manual_disc_value;

    	 	var today = moment();
            var diff = today.subtract(30, 'days');
                diff = diff.format("YYYY-MM-DDTHH:mm");

            var docSid = $stateParams.document_sid;

            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

		        	getPrevMarkfocDiscountTotal(diff, doc).then((prevTotalDiscount) => {

		        		getPrevMarkfocItemQuantity(diff, doc).then((prevTotalQuantity) => {

		        			getItemsTotalEstimation(doc, items).then((currentTotals) => {

		        				if ((prevTotalQuantity + currentTotals.totalQty) > config_other_discount_markfoc_qty) {
		        					ResourceNotificationService.showError('Error', 'Unable to apply discount. The customer has exceeded the quantity limit.');
		        					d.reject();
		        				} else if ((prevTotalDiscount + currentTotals.est + discValue) > config_other_discount_markfoc_limit) {
		        					ResourceNotificationService.showError('Error', 'Unable to apply discount. The customer has exceeded the quantity limit.');
		        					d.reject();
		        				} else {
		        					d.resolve();
		        				}
		        			});
		        		});
		        	});
	        	});
        	});
        } else {
        	d.resolve();
        }

        return d.promise;
    };

   	var handlerItemBefore = function($q, item){
        var d = $q.defer();

        if (config_enable_other_discount_markfoc && item.manual_disc_reason == 'MARKFOC') {

        	var discValue = item.manual_disc_value;

    	 	var today = moment();
            var diff = today.subtract(30, 'days');
                diff = diff.format("YYYY-MM-DDTHH:mm");

            var docSid = $stateParams.document_sid;

            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

		        	getPrevMarkfocDiscountTotal(diff, doc).then((prevTotalDiscount) => {

		        		getPrevMarkfocItemQuantity(diff, doc).then((prevTotalQuantity) => {

		        			getItemsTotalEstimation(doc, items).then((currentTotals) => {

		        				if ((prevTotalQuantity + currentTotals.totalQty + item.quantity) > config_other_discount_markfoc_qty) {
		        					ResourceNotificationService.showError('Error', 'Unable to apply discount. The customer has exceeded the quantity limit.');
		        					d.reject();
		        				} else if ((prevTotalDiscount + currentTotals.est + discValue) > config_other_discount_markfoc_limit) {
		        					ResourceNotificationService.showError('Error', 'Unable to apply discount. The customer has exceeded the quantity limit.');
		        					d.reject();
		        				} else {
		        					d.resolve();
		        				}

		        			});
		        		});
		        	});
	        	});
        	});

        } else {
        	d.resolve();
        }

        return d.promise;
    };

    function getPrevMarkfocDiscountTotal(diff, doc) {
        return new Promise(function(resolve, reject) {
            var total = 0;
            ModelService.get('Document', {filter: "(invoice_posted_date,ge,"+diff+")AND(bt_cuid,eq,"+doc.bt_cuid+")"}).then((prevDocs) => {
                if (!prevDocs.length) {
                    resolve(total);
                } else {

                    var prevDocsLen = prevDocs.length;

                    prevDocs.forEachWithCallback((el,i,next) => {
                        // console.log(i);

                        ModelService.get('Item', {document_sid: el.sid}).then((items) => {
                            if (!items.length) {
                                if (prevDocsLen == i) {
                                    resolve(total);
                                } else {
                                    next();
                                }
                                
                            } else {
                                var itemsLen = items.length;

                                items.forEachWithCallback((el2, i2, next2) => {

                                    if (!el2.discounts.length) {
                                        if (itemsLen == i2) {
                                            if (prevDocsLen == i) {
                                                resolve(total);
                                            } else {
                                                next();
                                            }
                                            
                                        } else {
                                            next2();
                                        }
                                        
                                    } else {

                                        var discsLen = el2.discounts.length;

                                        el2.discounts.forEachWithCallback((el3, i3, next3) => {

                                            $http.get(el3.link + '?cols=*').then((res) => {

                                                var disc = res.data[0];
                                                if (disc.disc_reason == 'MARKFOC') {
                                                    var prevDisc = disc.new_disc_amt;
                                                    if (el.receipt_type == 1) {
                                                        prevDisc = prevDisc * -1;
                                                    }

                                                    if (el.detax) {
                                                        total += (prevDisc / 1.12);
                                                    } else {
                                                        total += prevDisc;
                                                    }


                                                    
                                                }

                                                if (i3 == discsLen) {
                                                    if (itemsLen == i2) {
                                                        if (prevDocsLen == i) {
                                                            resolve(total);
                                                        } else {
                                                            next();
                                                        }
                                                    } else {
                                                        next2();
                                                    }
                                                }

                                                next3();
                                            });

                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    }

    function getPrevMarkfocItemQuantity(diff, doc) {
        return new Promise(function(resolve, reject) {
            var total = 0;
            ModelService.get('Document', {filter: "(invoice_posted_date,ge,"+diff+")AND(bt_cuid,eq,"+doc.bt_cuid+")"}).then((prevDocs) => {
                if (!prevDocs.length) {
                    resolve(total);
                } else {

                    var prevDocsLen = prevDocs.length;

                    prevDocs.forEachWithCallback((el,i,next) => {
                        // console.log(i);

                        ModelService.get('Item', {document_sid: el.sid}).then((items) => {
                            if (!items.length) {
                                if (prevDocsLen == i) {
                                    resolve(total);
                                } else {
                                    next();
                                }
                                
                            } else {
                                var itemsLen = items.length;

                                items.forEachWithCallback((el2, i2, next2) => {

                                    if (!el2.discounts.length) {
                                        if (itemsLen == i2) {
                                            if (prevDocsLen == i) {
                                                resolve(total);
                                            } else {
                                                next();
                                            }
                                            
                                        } else {
                                            next2();
                                        }
                                        
                                    } else {

                                        var discsLen = el2.discounts.length;

                                        el2.discounts.forEachWithCallback((el3, i3, next3) => {

                                            $http.get(el3.link + '?cols=*').then((res) => {

                                                var disc = res.data[0];
                                                if (disc.disc_reason == 'MARKFOC') {
                                                    total += el2.quantity;
                                                }

                                                if (i3 == discsLen) {
                                                    if (itemsLen == i2) {
                                                        if (prevDocsLen == i) {
                                                            resolve(total);
                                                        } else {
                                                            next();
                                                        }
                                                    } else {
                                                        next2();
                                                    }
                                                }

                                                next3();
                                            });

                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    }

    function getItemsTotalEstimation(doc, items) {
        return new Promise(function(resolve, reject) {
            var itemsLen = items.length

            var estimatedTotalDisc = 0;
            var totalQty = 0;

            items.forEachWithCallback((el2, i2, next2) => {

            	var passed = false;

                if (!el2.discounts.length) {
                    if (itemsLen == i2) {
                        resolve({
	                        est: estimatedTotalDisc,
	                        totalQty: totalQty,
	                        items: items
	                     });

                    } else {
                        next2();
                    }
                    
                } else {

                    var discsLen = el2.discounts.length;

                    el2.discounts.forEachWithCallback((el3, i3, next3) => {

                        $http.get(el3.link + '?cols=*').then((res) => {

                            var disc = res.data[0];
                            if (disc.disc_reason == 'MARKFOC') {
                            	var prevDisc = disc.new_disc_amt;
                                if (doc.receipt_type == 1) {
                                    prevDisc = prevDisc * -1;
                                }

                                if (doc.detax) {
                                    estimatedTotalDisc += (prevDisc / 1.12);
                                } else {
                                    estimatedTotalDisc += prevDisc;
                                }

                                passed = true;
                            }

                            if (i3 == discsLen) {
                                if (itemsLen == i2) {
                                	if (passed) {
                                		totalQty += el2.quantity;
                                	}

                                    resolve({
				                        est: estimatedTotalDisc,
				                        totalQty: totalQty,
				                        items: items
				                     });
                                } else {
                                	if (passed) {
                                		totalQty += el2.quantity;
                                	}

                                    next2();
                                }
                            }

                            next3();
                        });

                    });
                }
            });

        });
    }

    ModelEvent.addListener('document', 'onBeforeSave', handlerDocumentBefore);
    ModelEvent.addListener('item', 'onBeforeSave', handlerItemBefore);
 }];



 ConfigurationManager.addHandler(discountCtrl);
