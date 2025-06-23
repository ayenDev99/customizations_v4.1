var eJournalDocSID;
var zOutFilters = {};
// var zOutWorkstation = 'all';
// var zOutWorkstationNo = '';
var zOutAllWorkstations = '';
var currentZOutSID = null;
var isSavingNewTransaction = false;
var SOClosedOrder = null;

function ejournal_check_transform_design(transRes, transResName, ResourceNotificationService) {
	if (transRes.data.length) {
        return true;
  	} else {
  		ResourceNotificationService.showWarning( 'Warning:', 'E-journal was not created due to <strong>' + transResName + '</strong> was not found on document designer.');
  		return false;
  	}
}

function xzout_check_transform_design(transRes, transResName, NotificationService) {
	if (transRes.data.length) {
        return true;
  	} else {
  		NotificationService.addAlert('Unable to generate report X/Z-Out! Document design "'+ transResName +'" not found.', 'Error');
  		return false;
  	}
}


ButtonHooksManager.addHandler(['after_posOrderDetailsSave'], ($q, $stateParams, ModelService, ModelService2, $http, $state) => {
	var deferred = $q.defer();

	if (config_isSOPluginEnabled) {

		var docSid = $stateParams.document_sid;

		ModelService.get('Document', {sid: $stateParams.document_sid, cols:'*'}).then(function(documents) {
			var doc = documents[0];

			$http.get('v1/rest/document/'+docSid+'/item?cols=*',{headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(items){

				var item = items.data[0];

				if (item.fulfill_store_no != doc.store_number) {
					doc.order_tracking_number = item.fulfill_store_no;
				} else {
					doc.order_tracking_number = "";
				}

				doc.save().then(() => {
					$state.go($state.current, {}, {reload: true});
					deferred.resolve();
				});
			});
		});

	} else {
		deferred.resolve();
	}

	return deferred.promise;
});

$( document ).ready(function() {
	if (config_isSOPluginEnabled) {
	    var clickOrderDetails = sessionStorage.getItem('clickOrderDetails');
	    if (clickOrderDetails == 1) {
	    	setTimeout(() => {
	    		$('button[event-name="posTransactionOrderDetails"]').click();
	    	}, 2000);
	    	
	    	sessionStorage.removeItem('clickOrderDetails');
	    }
	}
});

ButtonHooksManager.addHandler(['before_posTransactionOrderDetails'], ($q, $stateParams, ModelService, ModelService2, $http, $state, $window) => {
	var deferred = $q.defer();

	if (config_isSOPluginEnabled) {

		eJournalDocSID = $stateParams.document_sid;

		var docSid = $stateParams.document_sid;
		var session = JSON.parse(sessionStorage.getItem("session"));
		ModelService.get('Document', {sid: $stateParams.document_sid, cols:'*'}).then(function(documents) {
			var doc = documents[0];
			// console.log(doc.store_number);
			// console.log(session);
			if (doc.order_tracking_number != "" && doc.status == 4 && session.storenumber != doc.store_number) {
				$http.get('api/common/store?filter=(sbssid,eq,'+doc.subsidiary_uid+')AND(storeno,eq,'+doc.order_tracking_number+')',{headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(stores){
					var store = stores.data.data[0];
					if (store.sid != doc.store_uid) {
						$.ajax({
							url: 'plugins/PLSO/SO_save_store_sid_manually.php',
							method: 'POST',
							data: {
								store_sid: store.sid,
								doc_sid: docSid
							},
							complete: function(data){
								$window.location.reload();
								sessionStorage.setItem('clickOrderDetails', 1);
								deferred.resolve();
							}
						})	
					} else {
						deferred.resolve();
					}
				});
			} else {
				deferred.resolve();
			}
		});

	} else {
		deferred.resolve();
	}

	return deferred.promise;
});


ButtonHooksManager.addHandler(['after_closedOrderConfirmed'],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService) {
    	var deferred = $q.defer();

    	if (SOClosedOrder) {

    		LoadingScreen.Enable = 1;

    		setTimeout(() => {

    			LoadingScreen.Enable = 1;

    			ModelService.get('Document', {filter: "(document_number,nn)AND(ref_order_sid,eq,"+SOClosedOrder+")", cols:'sid,document_number,ref_order_sid,udf_clob1,ref_order_order_doc_no,row_version,status'}).then(function(documents) {
    				
    				if (documents.length) {
    					var doc = documents[0];

    					ModelService.get('Document', {sid: SOClosedOrder, cols:'*'}).then(function(dataOrderDocument) {

							var orderDoc = dataOrderDocument[0];

							if (config_settingsVersion_receipts == 'v3') {

	    						var session = prismSessionInfo.get();

								$.ajax({
									url: 'plugins/PLConfigTool/getPrismConfigTool.php',
						            method: 'GET',
						            data: {
						            	sbsNo: session.subsidiarynumber,
						            	storeNo: session.storenumber,
						            	workstationNo: session.workstationnumber
						            },
						            success: function(results) {
						            	var config = JSON.parse(results);

						            	doc.status = 3;

						            	if (config_settingsVersion_receipts == 'v3') {
							            	doc.udf_clob1 = config.results;
							            }

						            	if (orderDoc.document_number) {
			            					doc.ref_order_order_doc_no = orderDoc.document_number;
			            				} else {
			            					doc.ref_order_order_doc_no = orderDoc.order_document_number;
			            				}

					            		doc.save().then(() => {

					            			// ModelService.get('Document', {sid: doc.sid, cols:'*'}).then(function(documents2) {
					            			// 	var doc2= documents2[0];
					            			// 	doc2.status = 4;
					            			// 	doc2.save(() => {
					            					eJournalDocSID = doc.sid;
							            			isSavingNewTransaction = true;
							            			LoadingScreen.Enable = 0;
							            			deferred.resolve();
					            			// 	});
					            			// });
					            		});
						            }
								});

							} else {
								eJournalDocSID = doc.sid;
		            			isSavingNewTransaction = true;
		            			LoadingScreen.Enable = 0;
		            			deferred.resolve();
							}

							SOClosedOrder = null;

						});
    				} else {
    					SOClosedOrder = null;
    					LoadingScreen.Enable = 0;
    					deferred.resolve();
    				}
    			});
    		}, 5000);
    	} else {
    		deferred.resolve();
    	}

    	return deferred.promise;
    }
);
ButtonHooksManager.addHandler(['after_posOrderDetailsDeactivateOrder'],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService) {
    	var deferred = $q.defer();

    	if (config_isSOPluginEnabled) {
    		var docSid = $stateParams.document_sid;
    		SOClosedOrder = docSid;
		} else {
			deferred.resolve();
		}
    	
    	return deferred.promise;
	}
);


ButtonHooksManager.addHandler(['before_posTransactionTenderTransaction', 'before_posTransactionCash', 'before_posTransactionCredit Card', 'before_posTransaction Credit', 'before_posTransactionDebit Card', 'before_posTransactionGift Certificate'], ($q, $stateParams) => {
	var deferred = $q.defer();
	eJournalDocSID = $stateParams.document_sid;
	deferred.resolve();
	return deferred.promise;
});


// --- REGULAR SALES AND RETURN ---
ButtonHooksManager.addHandler(['before_navPosTenderPrintUpdate','before_navPosTenderUpdateOnly'],
    function($q, LoadingScreen, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window) {
    	var deferred = $q.defer();
    	var docSid = $stateParams.document_sid;
    	eJournalDocSID = $stateParams.document_sid;
    	var qtsPluginVars = {};
    	var qtsManualPluginVars = {};

    	LoadingScreen.Enable = 1;

    	ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

    		var doc = dataDocument[0];

    		getDocItemsInvnsData(docSid, ModelService, $http).then((tempItems) => {

    			var itemsLen = tempItems.length;

    			if (itemsLen) {
    				var totalDRCoupQty = 0;
    				var totalMarkFOCDisc = 0;
    				for(var i = 0; i < itemsLen; i++) {
    					if (tempItems[i].has_drink_coup_disc) {
    						totalDRCoupQty += tempItems[i].quantity;
    						
    					}
    					if (tempItems[i].has_mark_foc_disc) {
    						totalMarkFOCDisc += tempItems[i].disc_value;
    						
    					}
    				}

    				if (totalDRCoupQty) {
	    				ModelService2.get('Customer', {sid: doc.bt_cuid, cols: "*,custextend.*"}).then((custs) => {
	    					var cust = custs[0];
	    						cust.mark2 = (parseInt(cust.mark2) - totalDRCoupQty).toString();
	    						cust.save();
						});
					}

					var employee = sessionStorage.getItem('employee_mark_foc');
					var employeeAuthSession = sessionStorage.getItem('employee_mark_foc_auth_session');

    				if (totalMarkFOCDisc) {

    					if (employee) {

    						ModelService2.get('Employee', {sid: employee, cols: "*.*"}).then((emps) => {
    							var emp = emps[0];

		    					var params = {
									data: [
										{
											udf4string: (parseFloat(emp.udf4string) - totalMarkFOCDisc).toString(),
											rowversion: emp.rowversion
										}
									]
								};

	    						$http.put('api/common/employee/'+employee+'?cols=*,emplphone.*,empladdress.*,emplemail.*,employeeextend.*,employeestore.*,employeesubsidiary.*,usergroupuser.*', params, {headers: {"Auth-Session": employeeAuthSession}}).then(function(emps){


								});
							});
    					}
	    				
					}
				}

				// QTS manual queing
				qts_manual_queing_plugin(doc, prismSessionInfo, ModelService, ResourceNotificationService).then((qtsManualVars) => {

					// Skipping invoice plugin
					skipping_invoice_plugin(doc, prismSessionInfo, ModelService, ResourceNotificationService).then(() => {

						print_update_callback(qtsPluginVars, qtsManualPluginVars, doc, tempItems, prismSessionInfo, ModelService).then((success) => {

							

							if (!success) {
	                            deferred.reject();
	                            LoadingScreen.Enable = 0;
	                        } else {
	                            deferred.resolve();

	                            // setTimeout(() => {



		                        //     // QTS queing
				    			// 	before_navPosTenderPrintUpdate_qts(ModelService, ModelService2, doc, tempItems, ResourceNotificationService, $http, base64, $window).then((qtsVars) => {

				    			// 		// Print 1:1
								//     	print_qts_1to1(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window).then(() => {
							    			
							    // 			// Print 1:all
							    // 			print_qts_1toAll(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window).then((success) => {
								// 				LoadingScreen.Enable = 0;
					    		// 				// if (qtsManualVars) {
						    	// 				// 	qtsManualPluginVars = qtsManualVars;
						    	// 				// } else {

						    	// 				// }
					    						
					    		// 				// if (qtsVars) {
						    	// 				// 	qtsPluginVars = qtsVars;
						    	// 				// } else {

						    	// 				// }

						    	// 				// deferred.resolve();

							    // 			});
							    // 		});
						    	// 	});

						    	// }, 1000);


	                        }


						});
					});
				});

    		});
    	});

    	return deferred.promise;
	}
);

// --- REGULAR SALES AND RETURN after ---
ButtonHooksManager.addHandler(['after_navPosTenderPrintUpdate','after_navPosTenderUpdateOnly'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window) {
    	var deferred = $q.defer();

    	var docSid = eJournalDocSID;

    	var qtsPluginVars = {};
    	var qtsManualPluginVars = {};

    	ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

    		var doc = dataDocument[0];

    		getDocItemsInvnsData(docSid, ModelService, $http).then((tempItems) => {

    			var itemsLen = tempItems.length;

    			// is QTS plugin enabled
    			if (is_prism_qts_plugin_enabled) {
    				console.log('qts plugin enabled.');
    				// QTS manual queing
    				// qts_manual_queing_plugin(doc, prismSessionInfo, ModelService, ResourceNotificationService).then((qtsManualVars) => {

	    				// QTS queing
	    				before_navPosTenderPrintUpdate_qts(ModelService, ModelService2, doc, tempItems, ResourceNotificationService, $http, base64, $window).then((qtsVars) => {

	    					// Print 1:1
					    	print_qts_1to1(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window).then(() => {
				    			
				    			// Print 1:all
				    			print_qts_1toAll(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window).then((success) => {
		
		    						// if (qtsManualVars) {
			    					// 	qtsManualPluginVars = qtsManualVars;
			    					// } else {

			    					// }
		    						
		    						// if (qtsVars) {
			    					// 	qtsPluginVars = qtsVars;
			    					// } else {

			    					// }

			    					deferred.resolve();

				    			});
				    		});
			    		});
    				// });

    			} else {
    				deferred.resolve();
    			}
    		});
    	});

    	return deferred.promise;
	}
);


// --- Printing 1 to 1 ---
ButtonHooksManager.addHandler(['before_navPosTenderPrint1to1'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window) {
    	var deferred = $q.defer();
    	
    	var session = JSON.parse(sessionStorage.getItem("session"));

    	var workstationName = session.workstation;
   
    	ModelService.get('Workstation', {filter: "(workstation_name,eq,"+workstationName+")"}).then(function(workstations) {

    		if (workstations.length) {

    			var workstation = workstations[0];

    			if (qts_printers.hasOwnProperty(workstationName)) {

	    			var printerName = qts_printers[workstationName]['1to1'];

					ModelService2.get('Printer', {filter: "(printername,eq,"+printerName+")AND(workstationsid,eq,"+workstation.sid+")"}).then(function(printers){

						if (printers.length) {
							var printer = printers[0];

			    			$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,"' + docDescign_qts_1to1_design_name + '")AND(resource_name,eq,'+docDescign_qts_1to1_resource_name+')', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transformDesigns){

			    				if (transformDesigns.data.length) {

			    					var transformDeisgn = transformDesigns.data[0];

			    					var docSid = $stateParams.document_sid;

			    					ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

							    		var doc = dataDocument[0];

							    		getDocItemsInvnsData(docSid, ModelService, $http).then((tempItems) => {

							    			var itemsLen = tempItems.length;

							    			if (itemsLen) {

												tempItems.forEachWithCallback((el, i, next) => {

													if (el.udf1_string.toLowerCase() == 'coffee' || el.udf1_string.toLowerCase() == 'non-coffee' || el.udf1_string.toLowerCase() == 'soft cream') {

														$http.get('v1/rest/document/transform/' + transformDeisgn.sid + '?filter=(SID,eq,'+doc.sid+')&type=print&printgiftitems='+ ((itemsLen+1) - i) +'=1&sort=item.ENHANCED_ITEM_POS,desc', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(trans){

															if (trans.data.length) {

																var answer = confirm("Printing " + el.description1 + " 1 to 1. Do you want to proceed?");

																if (answer == true) {
																	var params = [
																	    {
																	        "jobtype": "FastReports",
																	        "payload": trans.data[0].payload,
																	        "title": "Your Former Standard",
																	        "copies": 1
																	    }
																	];


																	$http.post('v1/rest/printer/' + printer.sid + '/job', params).then(function(jobs){

																	});

																	if (itemsLen == i) {
																		deferred.reject();
																	} else {
																		next();
																	}
																} else {

																  if (itemsLen == i) {
																		deferred.reject();
																	} else {
																		next();
																	}
																}

															} else {
																ResourceNotificationService.showError('Unable to print 1to1');

																if (itemsLen == i) {
																	deferred.reject();
																} else {
																	next();
																}
															}
														});
													} else {
														if (itemsLen == i) {
															deferred.reject();
														} else {
															next();
														}
													}
												})
											}
							    		});

							    	});


			    				} else {
			    					ResourceNotificationService.showError('Unable to print 1to1', 'Doc design ('+docDescign_qts_1to1_design_name+') not found.');
			    				}

			    			});

						} else {
							ResourceNotificationService.showError('Unable to print 1to1', 'Printer ('+printerName+') not found.');
						}
					   
					});
				} else {
					ResourceNotificationService.showError('Unable to print 1to1', 'Workstation name ('+workstationName+') not included in printer settings.');
				}

    		} else {
    			ResourceNotificationService.showError('Unable to print 1to1', 'Unable to find workstation.');
    		}

    	});

    	return deferred.promise;
	}
);

// --- Printing 1 to All ---
ButtonHooksManager.addHandler(['before_navPosTenderPrint1toAll'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window) {
    	var deferred = $q.defer();
    	
    	var session = JSON.parse(sessionStorage.getItem("session"));

    	var workstationName = session.workstation;
   
    	ModelService.get('Workstation', {filter: "(workstation_name,eq,"+workstationName+")"}).then(function(workstations) {

    		if (workstations.length) {

    			var workstation = workstations[0];

    			if (qts_printers.hasOwnProperty(workstationName)) {

	    			var printerName = qts_printers[workstationName]['1toAll'];

					ModelService2.get('Printer', {filter: "(printername,eq,"+printerName+")AND(workstationsid,eq,"+workstation.sid+")"}).then(function(printers){

						if (printers.length) {
							var printer = printers[0];

			    			$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,"' + docDescign_qts_1toAll_design_name + '")AND(resource_name,eq,'+docDescign_qts_1toAll_resource_name+')', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transformDesigns){

			    				if (transformDesigns.data.length) {

			    					var transformDeisgn = transformDesigns.data[0];

			    					var docSid = $stateParams.document_sid;

			    					ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

							    		var doc = dataDocument[0];

										$http.get('v1/rest/document/transform/' + transformDeisgn.sid + '?filter=(SID,eq,'+doc.sid+')&type=print&sort=item.ENHANCED_ITEM_POS,desc', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(trans){

											if (trans.data.length) {

												var params = [
												    {
												        "jobtype": "FastReports",
												        "payload": trans.data[0].payload,
												        "title": "Your Former Standard",
												        "copies": 1
												    }
												];


												$http.post('v1/rest/printer/' + printer.sid + '/job', params).then(function(jobs){

												});

											}

											deferred.reject();
										});

							    	});


			    				} else {
			    					ResourceNotificationService.showError('Unable to print 1toAll', 'Doc design ('+docDescign_qts_1toAll_design_name+') not found.');
			    				}

			    			});

						} else {
							ResourceNotificationService.showError('Unable to print 1toAll', 'Printer ('+printerName+') not found.');
						}
					   
					});
				} else {
					ResourceNotificationService.showError('Unable to print 1toAll', 'Workstation name ('+workstationName+') not included in printer settings.');
				}

    		} else {
    			ResourceNotificationService.showError('Unable to print 1toAll', 'Unable to find workstation.');
    		}

    	});

    	return deferred.promise;
	}
);

function qts_manual_queing_plugin(doc, prismSessionInfo, ModelService, ResourceNotificationService)
{
	return new Promise(function(resolve, reject) {
		if (is_prism_qts_manual_queing_enabled) {
			var qtsPluginVars = {};

			if (doc.receipt_type == 0) {

				$.ajax({
				    url: 'plugins/PLQTS/get_last_manual_queue_number.php',
				    method: 'POST',
				    success: function(response) {
				        var resp = JSON.parse(response);
				        console.log(resp);
				        if (!resp.success) {
				        	ResourceNotificationService.showError(response.message);
					    	resolve(false);
				        } else {
				        	qtsPluginVars.data = {
					        	count: resp.count
					        };

					        $.ajax({
							    url: 'plugins/PLQTS/send_order_to_manual_queue.php',
							    method: 'POST',
							    data: {
							    	payload: JSON.stringify(qtsPluginVars.data)
							    },
							    success: function(response) {
							    	
							    	
							    	doc.tracking_number = resp.count;

							    	doc.save().then(() => {
							    		resolve(qtsPluginVars);
							    	});
							    },
							    error: function(xhr, status, error) {
							        ResourceNotificationService.showError('Unable to save queue number. Please check the database connection.');
							    	resolve(false);
							    }
							});
				        }
				      
				    },
				    error: function(xhr, status, error) {
				        ResourceNotificationService.showError('Unable to get queue number. Please check the database connection.');
				    	resolve(false);
				    }
				});

			} else {
				console.log('document not sales')
				resolve(true);
			}
		} else {
			console.log('QTS Manual queing plugin is disabled.');
			resolve(false);
		}
	});
}

function skipping_invoice_plugin(doc, prismSessionInfo, ModelService, ResourceNotificationService)
{
	return new Promise(function(resolve, reject) {
		if (is_skipping_invoice_correction_enabled) {
			before_navPosTenderPrintUpdate_sequence_correction_callback(doc, prismSessionInfo, ModelService, ResourceNotificationService).then(() => {
				resolve(true);
			});
		} else {
			console.log('Skipping Invoice plugin is disabled.')
			resolve(false);
		}
	});
}

function before_navPosTenderPrintUpdate_qts(ModelService, ModelService2, doc, tempItems, ResourceNotificationService, $http, base64, $window)
{
	return new Promise(function(resolve, reject) {
		if (is_prism_qts_plugin_enabled) {
			before_navPosTenderPrintUpdate_qts_queing(ModelService, ModelService2, doc, tempItems, ResourceNotificationService, $http, base64, $window).then((qtsVars) => {
				resolve(qtsVars);
			});
		} else {
			console.log('QTS plugin is disabled.')
			resolve(false);
		}
	});
}

function before_navPosTenderPrintUpdate_qts_queing(ModelService, ModelService2, doc, tempItems, ResourceNotificationService, $http, base64, $window)
{
	return new Promise(function(resolve, reject) {

		if (is_prism_qts_queing_enabled) {

			var qtsPluginVars = {};

			qtsPluginVars.isScheduled = true;

			$.ajax({
			    url: 'plugins/PLQTS/get_last_queue_number.php',
			    method: 'POST',
			    success: function(response) {
			        var lastId = response;
			        if (!lastId) {
			        	lastId = 0;
			        } else {
			        	lastId = parseInt(lastId);
			        }

			        qtsPluginVars.data = {
			        	lastId: lastId,
			        	docSid: doc.sid,
			        	items: tempItems,
			        	isScheduled: qtsPluginVars.isScheduled,
			        	pos_flag2: doc.pos_flag2,
			        	receipt_type: doc.receipt_type,
			        	modifier1NoteNo: modifier1Text1NoteNo,
			        	modifier2NoteNo: modifier2Text3NoteNo,
			        	modifier3NoteNo: modifier3NoteNo
			        };

			        $.ajax({
					    url: 'plugins/PLQTS/send_order_to_queue.php',
					    method: 'POST',
					    data: {
					    	payload: JSON.stringify(qtsPluginVars.data)
					    },
					    success: function(response) {
					    	var lastId = response;
					    	ResourceNotificationService.showSuccessfulMessage('Success', 'Order has been successfully added to the queue. #' + lastId);
					    	qtsPluginVars.data.lastId = lastId;
					    	resolve(qtsPluginVars);
					    },
					    error: function(xhr, status, error) {
					        ResourceNotificationService.showError('Unable to save queue number. Please check the database connection.');
					    	resolve(false);
					    }
					});
			    },
			    error: function(xhr, status, error) {
			        ResourceNotificationService.showError('Unable to get queue number. Please check the database connection.');
			    	resolve(false);
			    }
			});
		} else {
			console.log('QTS queing plugin is disabled.');
			resolve(false);
		}
	});
}

function print_qts_1to1(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window)
{
	return new Promise(function(resolve, reject) {

		if (is_1to1_auto_print_enabled && doc.receipt_type === 0) {

			var session = JSON.parse(sessionStorage.getItem("session"));

	    	var workstationName = session.workstation;
	   
	    	ModelService.get('Workstation', {filter: "(workstation_name,eq,"+workstationName+")"}).then(function(workstations) {

	    		if (workstations.length) {

	    			var workstation = workstations[0];

	    			if (qts_printers.hasOwnProperty(workstationName)) {

		    			var printerName = qts_printers[workstationName]['1to1'];

						ModelService2.get('Printer', {filter: "(printername,eq,"+printerName+")AND(workstationsid,eq,"+workstation.sid+")"}).then(function(printers){

							if (printers.length) {
								var printer = printers[0];

								$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,"' + docDescign_qts_1to1_design_name + '")AND(resource_name,eq,'+docDescign_qts_1to1_resource_name+')', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transformDesigns){

									if (transformDesigns.data.length) {

										var transformDeisgn = transformDesigns.data[0];

										var docSid = doc.sid;

										ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

								    		var doc = dataDocument[0];

								    		getDocItemsInvnsData(docSid, ModelService, $http).then((tempItems) => {

								    			var itemsLen = tempItems.length;

								    			if (itemsLen) {

													tempItems.forEachWithCallback((el, i, next) => {

														if (el.udf1_string.toLowerCase() == 'coffee' || el.udf1_string.toLowerCase() == 'non-coffee' || el.udf1_string.toLowerCase() == 'soft cream') {

															$http.get('v1/rest/document/transform/' + transformDeisgn.sid + '?filter=(SID,eq,'+doc.sid+')&type=print&printgiftitems='+ ((itemsLen+1) - el.count) +'=1&sort=item.ENHANCED_ITEM_POS,desc', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(trans){

																if (trans.data.length) {

																	// var answer = confirm("Printing " + el.description1 + " 1 to 1. Do you want to proceed?");

																	// if (answer == true) {

																		var params = [
																			    {
																			        "jobtype": "FastReports",
																			        "payload": trans.data[0].payload,
																			        "title": "Your Former Standard",
																			        "copies": el.quantity
																			    }
																			];


																			$http.post('v1/rest/printer/' + printer.sid + '/job', params).then(function(jobs){

																			});
																		
																		if (itemsLen == i) {
																			resolve(true);
																		} else {
																			next();
																		}


																	// } else {
																	//   	if (itemsLen == i) {
																	// 		resolve(true);
																	// 	} else {
																	// 		next();
																	// 	}
																	// }

																} else {
																	ResourceNotificationService.showError('Unable to print 1to1');
																	
																	if (itemsLen == i) {
																		resolve(true);
																	} else {
																		next();
																	}
																}
															});
														} else {
															if (itemsLen == i) {
																resolve(true);
															} else {
																next();
															}
														}
													});
												}
								    		});

								    	});
									} else {
										ResourceNotificationService.showError('Unable to print 1to1', 'Doc design ('+docDescign_qts_1to1_design_name+') not found.');
										resolve(false);
									}

								});
							} else {
								ResourceNotificationService.showError('Unable to print 1to1');
								resolve(false);
							}
						});
					} else {
						ResourceNotificationService.showError('Unable to print 1to1', 'Workstation name ('+workstationName+') not included in printer settings.');
						resolve(false);
					}
				} else {
					ResourceNotificationService.showError('Unable to print 1to1');
					resolve(false);
				}
			});
		} else {
			console.log('print 1 to 1 plugin disabled.');
			resolve(false);
		}

	});
}

function print_qts_1toAll(ModelService, ModelService2, $http, tempItems, doc, $http, base64, ResourceNotificationService, $window)
{
	return new Promise(function(resolve, reject) {

		if (is_1to1_auto_print_enabled && doc.receipt_type === 0) {

			var session = JSON.parse(sessionStorage.getItem("session"));

	    	var workstationName = session.workstation;
	   
	    	ModelService.get('Workstation', {filter: "(workstation_name,eq,"+workstationName+")"}).then(function(workstations) {

	    		if (workstations.length) {

	    			var workstation = workstations[0];

	    			if (qts_printers.hasOwnProperty(workstationName)) {

		    			var printerName = qts_printers[workstationName]['1toAll'];

						ModelService2.get('Printer', {filter: "(printername,eq,"+printerName+")AND(workstationsid,eq,"+workstation.sid+")"}).then(function(printers){

							if (printers.length) {
								var printer = printers[0];

								$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,"' + docDescign_qts_1toAll_design_name + '")AND(resource_name,eq,'+docDescign_qts_1toAll_resource_name+')', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transformDesigns){

									if (transformDesigns.data.length) {

										var transformDeisgn = transformDesigns.data[0];

										var docSid = doc.sid;

										ModelService.get('Document', {sid: docSid, cols:'*'}).then(function(dataDocument) {

								    		var doc = dataDocument[0];

								    		getDocItemsInvnsData(docSid, ModelService, $http).then((tempItems) => {

								    			var itemsLen = tempItems.length;

								    			if (itemsLen) {

								    				var passed = true;

													tempItems.forEachWithCallback((el, i, next) => {

														// if (el.udf1_string.toLowerCase() == 'coffee' || el.udf1_string.toLowerCase() == 'non-coffee') {
														// 	passed = true;
														// }

														if (itemsLen == i) {
															if (passed) {
																$http.get('v1/rest/document/transform/' + transformDeisgn.sid + '?filter=(SID,eq,'+doc.sid+')&type=print&sort=item.ENHANCED_ITEM_POS,desc', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(trans){
																	if (trans.data.length) {

																		var params = [
																		    {
																		        "jobtype": "FastReports",
																		        "payload": trans.data[0].payload,
																		        "title": "Your Former Standard",
																		        "copies": 1
																		    }
																		];

																		$http.post('v1/rest/printer/' + printer.sid + '/job', params).then(function(jobs){

																		});
																	}

																	resolve(true);
																});
															} else {
																resolve(true);
															}
														} else {
															next();
														}
													});
												}
								    		});

								    	});
									} else {
										ResourceNotificationService.showError('Unable to print 1toAll', 'Doc design ('+docDescign_qts_1toAll_design_name+') not found.');
										resolve(false);
									}

								});
							} else {
								ResourceNotificationService.showError('Unable to print 1toAll');
								resolve(false);
							}
						});
					} else {
						ResourceNotificationService.showError('Unable to print 1toAll', 'Workstation name ('+workstationName+') not included in printer settings.');
						resolve(false);
					}
				} else {
					ResourceNotificationService.showError('Unable to print 1toAll');
					resolve(false);
				}
			});
		} else {
			console.log('print 1 to all plugin disabled.');
			resolve(false);
		}

	});
}

function before_navPosTenderPrintUpdate_sequence_correction_callback(doc, prismSessionInfo, ModelService, ResourceNotificationService)
{
	return new Promise(function(resolve, reject) {

        var session = prismSessionInfo.get();
		var preferences = session.preferences;

		var saleSeqLevel = preferences.documents_general_seq_level_sale;
		var returnSeqLevel = preferences.documents_general_seq_level_return;
		var soSeqLevel = preferences.documents_general_seq_level_order;

		if (preferences.use_single_sequence_for_return_and_sales == "False" || preferences.use_single_sequence_for_return_and_sales == "false") {
		    returnSeqLevel = preferences.documents_general_seq_level_return
		}

		if (preferences.use_single_sequence_for_all_order_types == "False" || preferences.use_single_sequence_for_all_order_types == "false") {
		    soSeqLevel = preferences.documents_general_seq_level_order;
		}

		var saleSeqFilter = '(document_kind,eq,0)AND(subsidiary_sid,eq,'+session.subsidiarysid+')';
		var returnSeqFilter = '(document_kind,eq,4)AND(subsidiary_sid,eq,'+session.subsidiarysid+')';
		var soSeqFilter = '(document_kind,eq,6)AND(subsidiary_sid,eq,'+session.subsidiarysid+')';

		var saleDocFilter = '(subsidiary_sid,eq,'+session.subsidiarysid+')';
		var returnDocFilter = '(subsidiary_sid,eq,'+session.subsidiarysid+')';
		var soDocFilter = '(subsidiary_sid,eq,'+session.subsidiarysid+')';

		if (saleSeqLevel == '1') {
		    saleSeqFilter = '(document_kind,eq,0)AND(store_sid,eq,'+session.storesid+')';
		    saleDocFilter = '(store_sid,eq,'+session.storesid+')';
		} else if (saleSeqLevel == '2') {
		    saleSeqFilter = '(document_kind,eq,0)AND(workstation_sid,eq,'+session.workstationid+')';
		    saleDocFilter = '(workstation_uid,eq,'+session.workstationid+')';
		}

		if (returnSeqLevel == '1') {
		    returnSeqFilter = '(document_kind,eq,4)AND(store_sid,eq,'+session.storesid+')';
		    returnDocFilter = '(store_sid,eq,'+session.storesid+')';
		} else if (returnSeqLevel == '2') {
		    returnSeqFilter = '(document_kind,eq,4)AND(workstation_sid,eq,'+session.workstationid+')';
		    returnDocFilter = '(workstation_uid,eq,'+session.workstationid+')';
		}

		if (soSeqLevel == '1') {
		    soSeqFilter = '(document_kind,eq,6)AND(store_sid,eq,'+session.storesid+')';
		    soDocFilter = '(store_sid,eq,'+session.storesid+')';
		} else if (soSeqLevel == '2') {
		    soSeqFilter = '(document_kind,eq,6)AND(workstation_sid,eq,'+session.workstationid+')';
		    soDocFilter = '(workstation_uid,eq,'+session.workstationid+')';
		}

		if (doc.receipt_type == '0') {

		    var receiptTypeFilter = '((receipt_type,eq,0)OR(receipt_type,eq,2))';

		    ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number,workstation_uid', sort: 'document_number,desc', 
		        filter: '(document_number,NN)AND'+receiptTypeFilter+'AND' + saleDocFilter}).then(function(prevDocs){

		        if (prevDocs.length) {
		            var prevDoc = prevDocs[0];

		            ModelService.get('Sequencing', {cols:'*', filter: saleSeqFilter}).then(function(saleSeqs) {
		                var saleSeq = saleSeqs[0];

		                if (prevDoc.document_number != saleSeq.previous_value) {
		                    var obj = {message: 'Invoice has been skipped. Sequencing will be modified. previous document number: ' + prevDoc.document_number + ' current sequence: ' + saleSeq.previous_value};
		                    $.ajax({
		                        url: '/plugins/PLLogs/api/write.php',
		                        data: { log: obj },
		                        method: 'POST',
		                        success: function() {

		                        }
		                    });
		                    
		                    if (is_skipping_invoice_correction_alert_enabled) {
		                        ResourceNotificationService.showWarning( 'Warning:', 'Invoice has been skipped. Sequencing will be modified.');
		                    }

		                    saleSeq.previous_value = prevDoc.document_number;
		                    saleSeq.save().then(() => {
		                        resolve(true);
		                    });
		                } else {
		                    resolve(true);
		                }
		            });
		        } else {
		            resolve(true);
		        }
		    });
		} else if (doc.receipt_type == '1') {
		    ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number', sort: 'document_number,desc', 
		        filter: '(document_number,NN)AND(receipt_type,eq,1)AND' + returnDocFilter}).then(function(prevDocs){
		        if (prevDocs.length) {
		            var prevDoc = prevDocs[0];

		            ModelService.get('Sequencing', {cols:'*', filter: returnSeqFilter}).then(function(returnSeqs) {
		                var returnSeq = returnSeqs[0];

		                if (prevDoc.document_number != returnSeq.previous_value) {
		                    var obj = {message: 'Invoice has been skipped. Sequencing will be modified. previous document number: ' + prevDoc.document_number + ' current sequence: ' + saleSeq.previous_value};
		                    $.ajax({
		                        url: '/plugins/PLLogs/api/write.php',
		                        data: { log: obj },
		                        method: 'POST',
		                        success: function() {

		                        }
		                    });

		                    if (is_skipping_invoice_correction_alert_enabled) {
		                        ResourceNotificationService.showWarning( 'Warning:', 'Invoice has been skipped. Sequencing will be modified.');
		                    }

		                    returnSeq.previous_value = prevDoc.document_number;
		                    returnSeq.save().then(() => {
		                        resolve(true);
		                    });
		                } else {
		                    resolve(true);
		                }
		            });
		        } else {
		            resolve(true);
		        }
		    });
		} else if (doc.receipt_type == '2') {
		    ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number', sort: 'document_number,desc', 
		        filter: '(document_number,NN)AND(receipt_type,eq,2)AND' + soDocFilter}).then(function(prevDocs){

		        if (prevDocs.length) {
		            var prevDoc = prevDocs[0];

		            ModelService.get('Sequencing', {cols:'*', filter: soSeqFilter}).then(function(soSeqs) {
		                var soSeq = soSeqs[0];

		                if (prevDoc.order_document_number != soSeq.previous_value) {
		                    if (is_skipping_invoice_correction_alert_enabled) {
		                        //ResourceNotificationService.showWarning( 'Warning:', 'SO # has been skipped. Sequencing will be modified.');
		                    }

		                    //soSeq.previous_value = prevDoc.order_document_number;
		                    soSeq.save().then(() => {
		                        if (doc.has_deposit) {
		                            ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number', sort: 'document_number,desc', filter: '(document_number,NN)AND((receipt_type,eq,0)OR(receipt_type,eq,2))AND' + saleDocFilter}).then(function(prevDocs){

		                                if (prevDocs.length) {
		                                    var prevDoc = prevDocs[0];

		                                    ModelService.get('Sequencing', {cols:'*', filter: saleSeqFilter}).then(function(saleSeqs) {
		                                        var saleSeq = saleSeqs[0];

		                                        if (prevDoc.document_number != saleSeq.previous_value) {
		                                            var obj = {message: 'Invoice has been skipped. Sequencing will be modified. previous document number: ' + prevDoc.document_number + ' current sequence: ' + saleSeq.previous_value};
		                                            $.ajax({
		                                                url: '/plugins/PLLogs/api/write.php',
		                                                data: { log: obj },
		                                                method: 'POST',
		                                                success: function() {

		                                                }
		                                            });

		                                            if (is_skipping_invoice_correction_alert_enabled) {
		                                                ResourceNotificationService.showWarning( 'Warning:', 'Invoice has been skipped. Sequencing will be modified.');
		                                            }

		                                            saleSeq.previous_value = prevDoc.document_number;
		                                            saleSeq.save().then(() => {
		                                                resolve(true);
		                                            });
		                                        } else {
		                                            resolve(true);
		                                        }
		                                    });
		                                } else {
		                                    resolve(true);
		                                }
		                            });
		                        } else {
		                            resolve(true);
		                        }
		                    });
		                } else {
		                    ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number', sort: 'post_date,desc', filter: '(document_number,NN)AND((receipt_type,eq,0)OR(receipt_type,eq,2))AND' + saleDocFilter}).then(function(prevDocs){
		                        if (prevDocs.length) {
		                            var prevDoc = prevDocs[0];

		                            ModelService.get('Sequencing', {cols:'*', filter: saleSeqFilter}).then(function(saleSeqs) {
		                                var saleSeq = saleSeqs[0];

		                                if (prevDoc.document_number != saleSeq.previous_value) {
		                                    var obj = {message: 'Invoice has been skipped. Sequencing will be modified. previous document number: ' + prevDoc.document_number + ' current sequence: ' + saleSeq.previous_value};
		                                    $.ajax({
		                                        url: '/plugins/PLLogs/api/write.php',
		                                        data: { log: obj },
		                                        method: 'POST',
		                                        success: function() {

		                                        }
		                                    });

		                                    if (is_skipping_invoice_correction_alert_enabled) {
		                                        ResourceNotificationService.showWarning( 'Warning:', 'Invoice has been skipped. Sequencing will be modified.');
		                                    }

		                                    saleSeq.previous_value = prevDoc.document_number;
		                                    saleSeq.save().then(() => {
		                                        resolve(true)
		                                    });
		                                } else {
		                                    resolve(true);
		                                }
		                            });
		                        } else {
		                            resolve(true);
		                        }
		                    });
		                }
		            });
		        } else {
		            if (doc.has_deposit) {
		                ModelService.get('Document', {page_no: 1, page_size: 1, cols: 'sid,document_number', sort: 'post_date,desc', filter: '(document_number,NN)AND((receipt_type,eq,0)OR(receipt_type,eq,2))'}).then(function(prevDocs){
		                    if (prevDocs.length) {
		                        var prevDoc = prevDocs[0];

		                        ModelService.get('Sequencing', {cols:'*', filter: saleSeqFilter}).then(function(saleSeqs) {
		                            var saleSeq = saleSeqs[0];

		                            if (prevDoc.document_number != saleSeq.previous_value) {
		                                var obj = {message: 'Invoice has been skipped. Sequencing will be modified. previous document number: ' + prevDoc.document_number + ' current sequence: ' + saleSeq.previous_value};
		                                $.ajax({
		                                    url: '/plugins/PLLogs/api/write.php',
		                                    data: { log: obj },
		                                    method: 'POST',
		                                    success: function() {

		                                    }
		                                });

		                                if (is_skipping_invoice_correction_alert_enabled) {
		                                    ResourceNotificationService.showWarning( 'Warning:', 'Invoice has been skipped. Sequencing will be modified.');
		                                }

		                                saleSeq.previous_value = prevDoc.document_number;
		                                saleSeq.save().then(() => {
		                                    resolve(true);
		                                });
		                            } else {
		                                resolve(true);
		                            }
		                        });
		                    } else {
		                        resolve(true);
		                    }
		                });
		            } else {
		                resolve(true);
		            }
		        }
		    });
		} else {
		    resolve(true);
		}
	});
}

function print_update_callback(qts, qtsManual, doc, items, prismSessionInfo, ModelService) 
{
	return new Promise(function(resolve, reject) {

		ModelService.get('Document', {sid: doc.sid, cols:'*'}).then(function(dataDocument) {
			var doc = dataDocument[0];

			// if (is_prism_qts_plugin_enabled) {
			// 	if (qts) {
			// 		if (Object.keys(qts).length !== 0) {
			// 			// doc.udf_string5 = qts.data.lastId;
			// 		}
			// 	}
			// 	if (is_prism_qts_manual_queing_enabled) {
			// 		if (qtsManual) {
			// 			if (Object.keys(qtsManual).length !== 0) {
			// 				//doc.tracking_number = qtsManual.data.count;
			// 			}
			// 		}
			// 	}
			// }

			if (config_settingsVersion_receipts == 'v3') {

		    	var session = prismSessionInfo.get();

		    	$.ajax({
					url: 'plugins/PLConfigTool/getPrismConfigTool.php',
		            method: 'GET',
		            data: {
		            	sbsNo: session.subsidiarynumber,
		            	storeNo: session.storenumber,
		            	workstationNo: session.workstationnumber
		            },
		            success: function(results) {
		            	var config = JSON.parse(results);
		            	doc.udf_clob1 = config.results;

	            		if (doc.ref_order_sid != "" && config_isSOPluginEnabled) {
	            			ModelService.get('Document', {sid: doc.ref_order_sid, cols:'*'}).then(function(dataOrderDocument) {
	            				var orderDoc = dataOrderDocument[0];
	            				if (orderDoc.document_number) {
	            					doc.ref_order_order_doc_no = orderDoc.document_number;
	            				} else {
	            					doc.ref_order_order_doc_no = orderDoc.order_document_number;
	            				}
	            				
	            				doc.save().then(() => {
			            			isSavingNewTransaction = true;
			            			resolve(true);
			            		});
	            			});
	            		} else {
	            			doc.save().then(() => {
		            			isSavingNewTransaction = true;
		            			resolve(true);
		            		});
	            		}
		            }
	        	});

		   	} else {

		   		if (doc.ref_order_sid != "" && config_isSOPluginEnabled) {
	    			ModelService.get('Document', {sid: doc.ref_order_sid, cols:'*'}).then(function(dataOrderDocument) {
	    				var orderDoc = dataOrderDocument[0];
	    				if (orderDoc.document_number) {
	    					doc.ref_order_order_doc_no = orderDoc.document_number;
	    				} else {
	    					doc.ref_order_order_doc_no = orderDoc.order_document_number;
	    				}
	    				
	    				doc.save().then(() => {
	            			isSavingNewTransaction = true;
	            			resolve(true);
	            		});
	    			});
	    		} else {
	    			doc.save().then(() => {
		    			isSavingNewTransaction = true;
		        		resolve(true);
		        	});
	    		}
		   	}
		
		});
	});
}

function getDocItemsInvnsData(docSid, ModelService, $http) {
	return new Promise(function(resolve, reject) {

		ModelService.get('Item', {document_sid: docSid, cols: 'sid,discounts,invn_sbs_item_sid' + ',note' + modifier1Text1NoteNo + ',note' + modifier1Text2NoteNo + ',note' + modifier2Text3NoteNo + ',note' + modifier2Text4NoteNo}).then(function(items){

			var itemsLen = items.length;

			var tempData = [];

			items.forEachWithCallback((el, i, next) => {

				ModelService.get('Inventory', {sid: el.invn_sbs_item_sid}).then((invns) => {

					var invn = invns[0];

					tempData.push({
						sid: el.sid,
						invn_sbs_item_sid: el.invn_sbs_item_sid,
						description1: invn.description1,
						modifier1: el['note' + modifier1Text1NoteNo] + '+' + el['note' + modifier1Text2NoteNo],
						modifier2: el['note' + modifier2Text3NoteNo] + '+' + el['note' + modifier2Text4NoteNo],
						modifier3: el['note' + modifier3NoteNo],
						udf1_string: invn.udf1_string,
						count: i,
						quantity: el.quantity,
						has_drink_coup_disc: false,
						has_mark_foc_disc: false,
						disc_value: 0
					});

					if (!el.discounts.length) {
                        if (itemsLen == i) {
                            resolve(tempData);
                        } else {
                            next();
                        }
                        
                    } else {

                        var discsLen = el.discounts.length;

                        el.discounts.forEachWithCallback((el3, i3, next3) => {

                            $http.get(el3.link + '?cols=*').then((res) => {

                                var disc = res.data[0];
                                console.log(disc);
                                if (disc.disc_reason == 'DRCOUP') {
                                    tempData[i-1].has_drink_coup_disc = true;
                                }

                                if (disc.disc_reason == 'MARKFOC') {
                                    tempData[i-1].has_mark_foc_disc = true;
                                    tempData[i-1].disc_value += disc.disc_value;
                                }

                                if (i3 == discsLen) {
                                    if (itemsLen == i) {
                                        resolve(tempData);
                                    } else {
                                        next();
                                    }
                                }

                                next3();
                            });

                        });
                    }
				});
			});
		});

	});
}

function pad_with_zeroes(number, length) {
    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;
}

var MyController = ['ModelEvent', '$q', 'DocumentPersistedData', 'ResourceNotificationService', '$uibModal', 'Templates', 'ModelService', '$rootScope', 'HookEvent', '$stateParams', 'base64', '$http', 'prismSessionInfo', 'authService', 'LoadingScreen', function(ModelEvent, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, LoadingScreen) {
    var handlerAfter = function($q, document){
        var d = $q.defer();
        if (document.status == 4 && isSavingNewTransaction) {
        	LoadingScreen.Enable = 1;
        	isSavingNewTransaction = false;
        	authService.checkLicense().then(function(checkLicense) {
	            if (checkLicense) {
	                setTimeout(() => {
						$http.get('v1/rest/document?filter=sid,eq,'+ eJournalDocSID + '&cols=receipt_type,created_datetime,store_uid,workstation_uid,sid,link,status,document_number',{headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(doc){
							
							var res = doc.data[0];

							var session = prismSessionInfo.get();

							ModelService.get('Vendor', {cols: 'sid,info1,info2,udf1_string,udf2_string,udf3_string,udf4_string,udf5_string,udf6_string', filter: "(vendor_code,eq," + session.storenumber + ")AND(active,eq,0)"}).then(function(vendorData) {

								if (config_isDocSequencePluginEnabled) {
								
									if (!vendorData.length) {
						  				ResourceNotificationService.showWarning( 'Warning:', 'No store configuration found on vendor. Custom document number will not be saved.');
						  				LoadingScreen.Enable = 0;
						  				d.resolve();
						  			} else {

						  				var vendor = vendorData[0];

						  				var fields = ['info1','info2','udf1_string','udf2_string','udf3_string','udf4_string','udf5_string','udf6_string'];

						  				var found = 0;

						  				for (var i = 0; i < fields.length; i++) {
						  					var field = vendor[fields[i]];
						  					field = String(field).split("-");

						  					if (field[0] == session.workstationnumber) {
						  						if (field.length == 3) {
						  							found = 1;

						  							//regular
						  							var regularPrefix = "";
						  							var returnPrefix = "";

						  							var pref1 = String(field[1]).split('=');
						  							if (pref1[0] == '1') {
						  								returnPrefix = pref1[1];
						  							} else {
						  								regularPrefix = pref1[1];
						  							}

						  							var pref2 = String(field[2]).split('=');
						  							if (pref2[0] == '1') {
						  								returnPrefix = pref2[1];
						  							} else {
						  								regularPrefix = pref2[1];
						  							}

							  						ModelService.get('Document', {cols: 'sid,document_number,row_version,tracking_number,receipt_type,ref_order_sid,store_number,order_document_number,has_deposit', filter: "(sid,eq," + eJournalDocSID + ")"}).then(function(currentDocData) {
														var currentDoc = currentDocData[0];

														var currentDocCount = currentDoc.document_number;

														var docPadLength = 6;
														if (currentDocCount.toString().length > 6) {
															docPadLength = currentDocCount.toString().length;
														}

														var newDocCount = pad_with_zeroes(currentDocCount, docPadLength);

														var trackNo = regularPrefix + newDocCount;
														if (currentDoc.receipt_type == 1) {
															var trackNo = returnPrefix + newDocCount;
														}
														
														currentDoc.tracking_number = trackNo;
														currentDoc.save().then(() => {

															if (currentDoc.ref_order_sid && config_isSOPluginEnabled) {
																callStoreReceiptGlobal(eJournalDocSID, session, res, $http, base64, ModelService).then(() => {
												  					ModelService.get('Document', {cols: '*', filter: "(sid,eq," + currentDoc.ref_order_sid + ")"}).then(function(orderDocs) {
																		var order = orderDocs[0];
												  						order.status = 3;
												  						order.order_tracking_number = order.store_number;
												  						isSavingNewTransaction = false;
												  						order.save().then(() => {
												  							LoadingScreen.Enable = 0;
														  					isSavingNewTransaction = false;
														  					d.resolve();
												  							// order.status = 4;
												  							// ModelService.get('Document', {cols: '*', filter: "(sid,eq," + currentDoc.ref_order_sid + ")"}).then(function(orderDocs) {
												  							// 	var order = orderDocs[0];
												  							// 	order.status = 4;
												  							// 	order.save().then(() => {
													  						// 		LoadingScreen.Enable = 0;
																  			// 		isSavingNewTransaction = false;
																  			// 		d.resolve();
																  			// 	});
												  							// });
												  						});
												  					});
												  				});
															} else {
																callStoreReceiptGlobal(eJournalDocSID, session, res, $http, base64, ModelService).then(() => {
												  					LoadingScreen.Enable = 0;
												  					isSavingNewTransaction = false;
												  					d.resolve();
												  				});
															}
														});
													});	
						  						}
					  						}
					  					}
					  					
					  					if (!found) {
						  					ResourceNotificationService.showWarning( 'Warning:', 'Store configuration on vendor is not properly configured/No workstation Custom document number will not be saved.');
						  					
						  					callStoreReceiptGlobal(eJournalDocSID, session, res, $http, base64, ModelService).then(() => {
							  					LoadingScreen.Enable = 0;
							  					isSavingNewTransaction = false;
							  					d.resolve();
							  				});
						  				}
						  			}
					  			} else {
					  				callStoreReceiptGlobal(eJournalDocSID, session, res, $http, base64, ModelService).then(() => {
					  					LoadingScreen.Enable = 0;
					  					isSavingNewTransaction = false;
					  					d.resolve();
					  				});
					  			}
							});
						});
					}, 1000);
	            }
	        });
        } else {
        	LoadingScreen.Enable = 0;
        	isSavingNewTransaction = false;
        	d.resolve();
        }

        return d.promise;
    };

    function callStoreReceiptGlobal(eJournalDocSID, session, res, $http, base64, ModelService) {
    	return new Promise(function(resolve, reject) {
	    	$.ajax({
				url: 'plugins/ejournal/dumping.php',
	            method: 'GET',
	            data: { 
	            	action: 'perTransactionDumping',
	            	docSID: eJournalDocSID,
	            	subsidiaryNo: session.subsidiarynumber
	           	}
			});

			if (config_settingsVersion_receipts == 'v3') {

				if (res.receipt_type != 1){
					$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_trans_v3 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){                
						var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_regular_trans_v3, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
	        				storeReceipt(res, design, 1, base64, $http, ModelService, 'sales', 'regular').then(() => {
		    					resolve(true);
		    				});
						}
	                });
				} else if (res.receipt_type == 1){
	                $http.get('/v1/rest/transformdesign?cols=sid,design_name&filter=(design_name,eq,' + config_docDesign_return_trans_v3 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
	                	var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_return_trans_v3, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
	        				storeReceipt(res, design, 2, base64, $http, ModelService, 'sales','return').then(() => {
		    					resolve(true);
		    				});
						}
					});
				} else if (res.receipt_type == 2 && res.has_deposit){
					$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_trans_v3 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){                
						var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_regular_trans_v3, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
		    				storeReceipt(res, design, 1, base64, $http, ModelService, 'sales', 'regular').then(() => {
		    					resolve(true);
		    				});
						}
		            });
				} else {
					resolve(true);
				}

			} else {

				if (res.receipt_type != 1){
					$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_trans_v2 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){                
						var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_regular_trans_v2, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
	        				storeReceipt(res, design, 1, base64, $http, ModelService, 'sales', 'regular').then(() => {
		    					resolve(true);
		    				});
						}
	                });
				} else if (res.receipt_type == 1){
	                $http.get('/v1/rest/transformdesign?cols=sid,design_name&filter=(design_name,eq,' + config_docDesign_return_trans_v2 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
	                	var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_return_trans_v2, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
	        				storeReceipt(res, design, 2, base64, $http, ModelService, 'sales','return').then(() => {
		    					resolve(true);
		    				});
						}
					});
				} else if (res.receipt_type == 2 && res.has_deposit){
					$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_trans_v2 + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){                
						var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_regular_trans_v2, ResourceNotificationService);

						if (transform_deisgn_validation) {
							var design = transRes.data[0];
		    				storeReceipt(res, design, 1, base64, $http, ModelService, 'sales', 'regular').then(() => {
		    					resolve(true);
		    				});
						}
		            });
				} else {
					resolve(true);
				}

			}
    	});
    }

    ModelEvent.addListener('document', 'onAfterSave', handlerAfter);
 }];
 ConfigurationManager.addHandler(MyController);

// --- REPRINT: REGULAR AND RETURN ---
ButtonHooksManager.addHandler(['before_navPosTransactionPrint'],
    function($q, DocumentPersistedData, NotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, ResourceNotificationService, authService) {
		var deferred = $q.defer();

		authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                $http.get('v1/rest/document?filter=sid,eq,'+ $stateParams.document_sid + '&cols=receipt_type,created_datetime,store_uid,workstation_uid,sid,link,status,document_number',{headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(doc){
		        	var res = doc.data[0];

		        	var config_docDesign_regular_reprint_trans = config_docDesign_regular_reprint_trans_v2;
			        var config_docDesign_return_reprint_trans = config_docDesign_return_reprint_trans_v2;

			        if (config_settingsVersion_receipts == 'v3') {
			            config_docDesign_regular_reprint_trans = config_docDesign_regular_reprint_trans_v3;
			            config_docDesign_return_reprint_trans = config_docDesign_return_reprint_trans_v3;
			        }

					if (res.receipt_type != 1){

						$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_reprint_trans + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
		                    var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_regular_reprint_trans, ResourceNotificationService);

							if (transform_deisgn_validation) {
								var design = transRes.data[0];
								storeReceipt(res, design, 1, base64, $http, ModelService, 'sales', 'regular_reprint');
							}
		                });
		                
					} else if (res.receipt_type == 1){
		                $http.get('/v1/rest/transformdesign?cols=sid,design_name&filter=(design_name,eq,' + config_docDesign_return_reprint_trans + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
		                    var transform_deisgn_validation = ejournal_check_transform_design(transRes, config_docDesign_return_reprint_trans, ResourceNotificationService);

							if (transform_deisgn_validation) {
								var design = transRes.data[0];
								storeReceipt(res, design, 2, base64, $http, ModelService, 'sales', 'return_reprint');
							}
						});
					}

		        });
            }
        });

        

        deferred.resolve();
        return deferred.promise;
	}
);

// ZOUT - AFTER RECONCILE DIRECT PRINT
ButtonHooksManager.addHandler(['before_navZoutPrint', 'before_navZoutFinalize'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, $location, LoadingScreen, $window, authService) {
    	var deferred = $q.defer();
	console.log('before_navZoutFinalize');
    	authService.checkLicense().then(function(checkLicense) {
		var test = currentZOutSID;
		console.log(test);

    		if ($('.z-out-result-item-active').length) {
    			var currentZOut = $('.z-out-result-item-active');
    			// currentZOutSID = currentZOut.attr('sid');
			currentZOutSID = currentZOut.find('.sid').val();
    		}

            if (checkLicense && currentZOutSID) {
                var session = prismSessionInfo.get();

		  		// var fromDate = $.trim($('#customerSearchPane .active div:contains("Open Date")').last().text().replace('Open Date', ''));
				// var toDate = $.trim($('#customerSearchPane .active div:contains("Close Date")').last().text().replace('Close Date', ''));

				ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {

				    ModelService.get('ZoutControl',{sid:currentZOutSID, cols:'*'}).then(function(zcontrol) {

				    	ModelService2.get('Employee', {filter:"(emplname,eq,"+zcontrol[0].closed_by+")"}).then(function(emp2) {

					    	var zOut = zcontrol[0];
					        var PCONTROLSID = zcontrol[0].sid;
							
					        var work = "all";
					   		if (zOut.workstation_sid != null && zOut.workstation_sid != "") {
					   			work = zOut.workstation_sid;
					   		}

					   		var workNo = "";
					   		if (zOut.workstation_number != null && zOut.workstation_number != "") {
					   			workNo = zOut.workstation_number;
					   		}

							var path = $location.path().toString();
								  
							// let date_range = [
							// 	{ key: 'period_begin', value: zOut.period_begin },
							// 	{ key: 'period_end', value: zOut.period_end },
							// ];

							// date_range.forEach((date, idx) => {
							// 	if (!isValidISOWithTimezoneOffset(date.value))
							// 	{
							// 		let date_value 		= new Date(date.value);
							// 		let year 			= date_value.getFullYear();
							// 		let month 			= String(date_value.getMonth() + 1).padStart(2, '0');
							// 		let day 			= String(date_value.getDate()).padStart(2, '0');
							// 		let hours 			= String(date_value.getHours()).padStart(2, '0');
							// 		let minutes 		= String(date_value.getMinutes()).padStart(2, '0');
							// 		let seconds 		= String(date_value.getSeconds()).padStart(2, '0');
							// 		let milliseconds 	= String(date_value.getMilliseconds()).padStart(3, '0');
							// 		let timezoneOffset 	= '+08:00';
							// 		let formattedDate 	= `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;

							// 		date.value = formattedDate;
							// 	};
							// });

							// let periodBeginValue = date_range.find(item => item.key === 'period_begin').value;
							// let periodEndValue = date_range.find(item => item.key === 'period_end').value;

							zOutFilters = {
								'fromDate'			: zOut.period_begin
								, 'toDate'			: zOut.period_end
								, 'subsidiary'		: ''
								, 'installation'	: ''
								, 'store'			: ''
								, 'workstation'		: work
								, 'workstationNo'	: workNo
								, 'allWorkstations'	: zOutAllWorkstations
								, 'drawer'			: ''
								, 'till'			: ''
								, 'cashier'			: ''
								, 'cashierName'		: emp[0].emplname
							    , 'cashierId'		: emp[0].emplid
							    , 'sequence'		: zOut.sequence
							    , 'sbsNo'			: session.subsidiarynumber
							    , 'storeNo'			: session.storenumber
							}

							//if (zOut.finalized == "0") {
							//	zOut.finalized = "1";
							//	zOut.save();
							// }
							
							if (config_settingsVersion_xzout == 'v3') {
								$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v3 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
									var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v3, NotificationService);

									if (transform_deisgn_validation) {
										if (config_isZoutPreviewEnabled) {
					        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
										} else {
											directPrintXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
										}

											processXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
												
										});
									}
								});
							} else {
								$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v2 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
									var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v2, NotificationService);

									if (transform_deisgn_validation) {
										if (config_isZoutPreviewEnabled) {
					        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
										} else {
											directPrintXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
										}

										processXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
												
										});
			
										
									}
								});
							}
							

							
						});
					});

				});
            }
        });

		deferred.reject();
		return deferred.promise;
    }
);

function isValidISOWithTimezoneOffset(dateStr) 
{
	const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2})$/;
	return regex.test(dateStr);
}

// ZOUT - LOOKUP DIRECT PRINT
ButtonHooksManager.addHandler(['before_zOutSearchPrint'],
    function(ResourceNotificationService, $q, DocumentPersistedData, NotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, $location, LoadingScreen, $window, authService) {
    	var deferred = $q.defer();

    	authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                var session = prismSessionInfo.get();

                var path = $location.path().toString();

		  		// var fromDate = $.trim($('#customerSearchPane .active div:contains("Open Date")').last().text().replace('Open Date', ''));
				// var toDate = $.trim($('#customerSearchPane .active div:contains("Close Date")').last().text().replace('Close Date', ''));

				ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {

				    ModelService.get('ZoutControl',{sid:$('#customerSearchPane .active').attr('sid')}).then(function(zcontrol) {
					   	var PCONTROLSID = zcontrol[0].sid;

					   	ModelService2.get('Employee', {filter:"(emplname,eq,"+zcontrol[0].closed_by+")"}).then(function(emp2) {

					   		ModelService.get('Subsidiary',{sid: zcontrol[0].sbs_sid}).then(function(dataSBS) {

						    	ModelService.get('Store',{sid: zcontrol[0].store_sid}).then(function(dataStore) {

							   		var work = "all";
							   		if (zcontrol[0].workstation_sid != null && zcontrol[0].workstation_sid != "") {
							   			work = zcontrol[0].workstation_sid;
							   		}

							   		var workNo = "";
							   		if (zcontrol[0].workstation_number != null && zcontrol[0].workstation_number != "") {
							   			workNo = zcontrol[0].workstation_number;
							   		}

									zOutFilters = {
										'fromDate': zcontrol[0].period_begin,
										'toDate': zcontrol[0].period_end,
										'subsidiary': '',
										'installation': '',
										'store': '',
										'workstation': work,
										'workstationNo': workNo,
										'allWorkstations': zOutAllWorkstations,
										'drawer': '',
										'till': '',
										'cashier': '',
										'cashierName': emp2[0].emplname,
										'cashierId': emp2[0].emplid,
										'sequence': zcontrol[0].sequence,
										'sbsNo': dataSBS[0].subsidiary_number,
						    			'storeNo': dataStore[0].store_number
									}

									if (config_settingsVersion_xzout == 'v3') {
										$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v3 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
											var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v3, NotificationService);


											if (config_isZoutPreviewEnabled) {
						        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
											} else {
												directPrintXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
											}

											processXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol[0], base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
												generateEjournalPerDay(zcontrol[0].period_begin, ModelService, $http, base64);
											});
										});

									} else {
										$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v2 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
											var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v2, NotificationService);


											if (config_isZoutPreviewEnabled) {
						        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
											} else {
												directPrintXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol, base64, ModelService, ModelService2, $http, LoadingScreen, $window, {});
											}

											processXOutZOut('zout', PCONTROLSID, session, 6, format, zcontrol[0], base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
												generateEjournalPerDay(zcontrol[0].period_begin, ModelService, $http, base64);
											});
										});
									}

								});
							});
						});
					});	
				});
            }
        });

		deferred.reject();
		return deferred.promise;
    }
);

// XOUT - DIRECT PRINT
ButtonHooksManager.addHandler(['before_navXOutPrint'],
    function(ResourceNotificationService, $uibModal, $q, DocumentPersistedData, NotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, $location, LoadingScreen, $window, authService) {
    	var deferred = $q.defer();

    	authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                var session = prismSessionInfo.get();
                var path = $location.path().toString();

				ModelService.get('ZoutControl', {page_no: 1, page_size: 1, cols: '*', sort: 'created_datetime,desc'}).then(function(result){
		            
					if (result.length) {

						var formFilter = $('#xOutForm');

						var sbsSID = formFilter.find('#subsidiary').val().replace('string:', '');
					    var storeSID = formFilter.find('#store').val().replace('string:', '');

					    ModelService.get('Subsidiary',{sid: sbsSID}).then(function(dataSBS) {

						    ModelService.get('Store',{sid: storeSID}).then(function(dataStore) {

						    	var data = {
						    		sbsNo: dataSBS[0].subsidiary_number,
						    		storeNo: dataStore[0].store_number
						    	};

					            var PCONTROLSID = result[0].sid;

					            if (config_settingsVersion_xzout == 'v3') {

									$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_XOUT_v3 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
										var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_XOUT_v3, NotificationService);

										if (transform_deisgn_validation) {
											if (config_isXoutPreviewEnabled) {
						        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'xout', PCONTROLSID, session, 5, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, data);
											} else {
						        				directPrintXOutZOut('xout', PCONTROLSID, session, 5, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, data);
											}

											var isReturnSeparateSequence = true;
											// if ($('#separate-return-sequence').is(':checked')) {
											// 	isReturnSeparateSequence = true;
											// }

											processXOutZOut('xout', PCONTROLSID, session, 6, format, result, base64, ModelService, ModelService2, $http, 'print', path, isReturnSeparateSequence, data).then(() => {
												
											});

											$.ajax({
												url: '/plugins/PLLogs/api/write.php',
												data: { log: {message:  session.employeename + ' printing an x-reading.'} },
												method: 'POST',
												success: function() {

												}
											});
										}
									});

								} else {

									$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_XOUT_v2 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
										var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_XOUT_v2, NotificationService);

										if (transform_deisgn_validation) {
											if (config_isXoutPreviewEnabled) {
						        				directPreviewXOutZOut(ResourceNotificationService, $uibModal, 'xout', PCONTROLSID, session, 5, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, data);
											} else {
						        				directPrintXOutZOut('xout', PCONTROLSID, session, 5, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, data);
											}

											var isReturnSeparateSequence = true;
											// if ($('#separate-return-sequence').is(':checked')) {
											// 	isReturnSeparateSequence = true;
											// }

											processXOutZOut('xout', PCONTROLSID, session, 6, format, result, base64, ModelService, ModelService2, $http, 'print', path, isReturnSeparateSequence).then(() => {
												
											});

											$.ajax({
												url: '/plugins/PLLogs/api/write.php',
												data: { log: {message:  session.employeename + ' printing an x-reading.'} },
												method: 'POST',
												success: function() {

												}
											});
										}
									});

								}
							});
						});
					} else {
						NotificationService.addAlert('No Z-Out Control found!', 'Error:');
					}
				});
            }
        });

    	deferred.reject();
		return deferred.promise;
	}
);

// ZOUT - GENERATE ALL TEXT FILES
ButtonHooksManager.addHandler(['before_zOutGenerateTextFiles'],
    function($q, DocumentPersistedData, NotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, $location, LoadingScreen, $window, authService) {
    	var deferred = $q.defer();

    	authService.checkLicense().then(function(checkLicense) {
            if (checkLicense) {
                LoadingScreen.Enable = 1;

		    	var session = prismSessionInfo.get();
				var path = $location.path().toString();

				ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {
			    	$.ajax({
			    		url: 'plugins/afterPrint/GetAllClosedZOuts.php',
			    		method: 'GET',
			    		success: function(data) {
			    			var zcontrols = JSON.parse(data).results;
							var len = zcontrols.length;

			    			zcontrols.forEachWithCallback((el, i, next) => {

			    				ModelService2.get('Employee', {sid:el.cashier_sid}).then(function(emp2) {

			    					var work = "all";
			    					if (el.workstation_sid != null && el.workstation_sid != "") {
							   			work = el.workstation_sid;
							   		}

			    					var workNo = "";
							   		if (el.workstation_number != null && el.workstation_number != "") {
							   			workNo = el.workstation_number;
							   		}

									zOutFilters = {
										'fromDate': el.period_begin,
										'toDate': el.period_end,
										'subsidiary': '',
										'installation': '',
										'store': '',
										'workstation': work,
										'workstationNo': workNo,
										'allWorkstations': zOutAllWorkstations,
										'drawer': '',
										'till': '',
										'cashier': '',
										'cashierName': emp2[0].emplname,
										'cashierId': emp2[0].emplid,
										'sequence': el.sequence,
										'sbsNo': session.subsidiarynumber,
						    			'storeNo': session.storenumber
									}

									if (config_settingsVersion_xzout == 'v3') {
										$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=design_name,eq,' + config_docDesign_ZOUT_v3, {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
							        		processXOutZOut('zout', el.sid, session, 6, format, [el], base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
							        			if (i == len) {
													LoadingScreen.Enable = 0;
													deferred.reject();
												}
												next();	
							        		});
										});
									} else {
										$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=design_name,eq,' + config_docDesign_ZOUT_v2, {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
							        		processXOutZOut('zout', el.sid, session, 6, format, [el], base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
							        			if (i == len) {
													LoadingScreen.Enable = 0;
													deferred.reject();
												}
												next();	
							        		});
										});
									}

								});
							});
			    		},
			    		error: function(er) {
			    			console.log(er);
			    			LoadingScreen.Enable = 0;
			    		}
			    	});
			    });
            }
        });

		return deferred.promise;
	}
);

function directPreviewXOutZOut(ResourceNotificationService, $uibModal, type, PCONTROLSID, session, printType, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, otherData) {
	// LoadingScreen.Enable = 1;

	var modalOptions = {
        backdrop: 'static',
        windowClass: 'half',
        templateUrl: '/plugins/PLXZOutPreview/index.htm',
        controller: 'xzOutCtrl'
    };
	
	console.log('direct preview');

    $uibModal.open(modalOptions);

	var params = [{
		"Params": {
			// "PMODE":"1",
			"PMODE":"2",
			"PCONTROLSID":PCONTROLSID,
			"PREPORTDATE":(new Date).toISOString(),
			"PSOURCE":null,
			"PDESTSBSNO":session.subsidiarysid,
			"PDATEFORMAT":null,
			"PDISCREPANCYLIST":null,
			"PNETCURRENCYTOT":null,
			"PNETNONCURRENCYTOT":null,
			"PCASHDROPAMT":null,
			"PUSERID":null,
			"PZREGISTERROWID":null,
			"PTRANSLATEDSTRINGS":null,
			"PDESIGNSID":format.data[0].sid,
			"PDESTINATION":"preview"
		},
		"MethodName":"GenerateXZOutReport"
	}];

	$.ajax({
        url: "plugins/afterPrint/ejournal.php"
        ,type: "POST"
        ,proccessData: false
        ,data: { 
        	datefrom: result[0].created_datetime, 
        	store: session.storesid, 
        	workstation: session.workstationid, 
        	printtype: printType, 
        	sid: PCONTROLSID, 
        	content: params, 
        	auth: sessionStorage.getItem("PRISMAUTH") 
        }
        ,success: function(data) {

			var content = JSON.parse(data);

			if (!content.success) {
				ResourceNotificationService.showError('Error', content.message);
				return;
			}

			var contain = content.contain;
			var htmldata2 = base64.decode(contain);
			htmldata2 = $(htmldata2);

			htmldata2.find('div').each((index, elem) => {
				var className = $(elem).text().replace('value#', "");
				$(elem).addClass(className);
			});

			var htmldata = $('<html>').append(htmldata2);

			// if (!$('#separate-return-sequence').is(':checked') && type != 'zout') {
			// 	htmldata.find('.BEGINNING.RETURN').text('TOTAL SI');
			// 	htmldata.find('.transaction_counter_beginning_return').text('value#transaction_counter_total_si');
			// 	htmldata.find('.ENDING.RETURN').text('');
			// 	htmldata.find('.transaction_counter_ending_return').text('');
			// }

			var dynamicElements = $(htmldata).find('div#page1 div:contains("value#")');

			if (!config_isNetAmountRoundingOffEnabled) {
				$(htmldata).find('div#page1 div:contains("value#minus_net_round_amount")').remove();
				$(htmldata).find('div#page1 div:contains("MINUS")').remove();
				$(htmldata).find('div#page1 div:contains("NET ROUND AMOUNT")').remove();
			}

			var dynamicFields = {};
			dynamicElements.each((index, elem) => {
		    	dynamicFields[$(elem).text()] = 0.00;
		    });

			if (!$('#iframe-xout-zout-container').length) {
				// if (config_isXoutZoutPreviewEnabled) {
				// 	$('body').append('<div id="iframe-xout-zout-container"></div>');
				// } else {
					$('body').append('<div id="iframe-xout-zout-container" style="visibility: hidden; height: 0; overflow: hidden;"></div>');
				// }
			} else {
				$('#iframe-xout-zout-container').empty();
			}

			// 

			var iframedoc = document.createElement('iframe');
		    iframedoc.setAttribute('id', 'preview_frame0');
		    iframedoc.setAttribute('class', 'col-md-12');
		    iframedoc.setAttribute('scrolling', 'no');
		    iframedoc.style.border = 'none';
		    $('#iframe-xout-zout-container').append(iframedoc);

		    // GET ALL DYNAMIC VALUES
		    ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {

		    	ModelService.get('Workstation').then(function(dataWorkstations) {
				  	var allWorkstations = [];
				  	for (var i = 0; i < dataWorkstations.length; i++) {
				  		if (dataWorkstations[i].workstation_number != "") {
				  			allWorkstations.push(dataWorkstations[i].workstation_number);
				  		}
				  	}
				  	allWorkstations = allWorkstations.join();

				    if (type == 'xout') {
				    	var formFilter = $('#xOutForm');

				    	var workstationNo = session.workstationnumber;

				    	var workstation = formFilter.find('[ng-model="form.workstation"]').val();
				    		workstation = workstation.replace('string:', '');

				    	if (workstation == "") {
				    		workstation = 'all';
				    		workstationNo = 'all';
				    	} else {
				    		var tempWS = dataWorkstations.find(elem => elem.sid == workstation);
				    		workstationNo = tempWS.workstation_number;
				    	}

				    	var filters = {
					    	'fromDate': formFilter.find('input[ng-model="startDate.date"]').val(),
					    	'toDate': formFilter.find('input[ng-model="endDate.date"]').val(),
					    	'subsidiary': formFilter.find('#subsidiary').val().replace('string:', ''),
					    	'installation': formFilter.find('#installation').val().replace('string:', ''),
					    	'store': formFilter.find('#store').val().replace('string:', ''),
					    	'workstationNo': session.workstationnumber,
					    	'drawer': formFilter.find('#drawer').val().replace('string:', ''),
					    	'till': formFilter.find('#till').val().replace('string:', ''),
					    	'cashier':  formFilter.find('#cashier').val().replace('string:', ''),
					    	'cashierName': emp[0].emplname,
					    	'cashierId': emp[0].emplid,
					    	'workstation': workstation,
					    	'allWorkstations': allWorkstations,
					    	...otherData
					    }
						
						console.log(filters);

				    } else {
				    	var formFilter = $('#zoutSearchForm');
				    	var filters = zOutFilters;
				    }

				    $.ajax({
				    	url: 'plugins/afterPrint/XOutZOut.php',
				    	method: 'POST',
				    	data: {
				    		action: 'getDynamicValuesXOutZOut',
				    		fields: dynamicFields,
				    		filters: filters,
				    		config_settingsVersion: config_settingsVersion_xzout
				    	},
				    	success: function(data) {
				    		var data = JSON.parse(data);
							let zcount = data.zcount;	

				    		dynamicElements.each((index, elem) => {

				    			if (data.data[$(elem).text()] == 'empty value') {
				    				$(elem).remove();
				    			} else {

				    				if (typeof data.data[$(elem).text()] === 'object') {
				    					$(elem).html(JSON.stringify(data.data[$(elem).text()])).addClass('json');
				    				} else {
				    					$(elem).html(data.data[$(elem).text()]);
				    				}
				    			}
						    });

						    htmldata.find('div#page1 > div').css('font-size', '12px', 'important');
							htmldata.find('div#page1 > div').css('font-family', 'Tahoma', 'important');

						    var body = angular.element(htmldata).find('page1');
						    divdata = body.prevObject;
						    parsediv = angular.element(divdata).find('div');

						    var sortable = [];

						    var arrData = [];

						    for (var i = 1; i<=parsediv.length; i++) {

						    	if (typeof parsediv[i] != 'undefined' ) {
				                	var y = parseInt((parsediv[i].style.top).replace("px",""));
					                var x = parseInt((parsediv[i].style.left).replace("px",""));
					                
					                arrData[i] = {};
					                arrData[i]['y']= {};
					                arrData[i]['y']= y;
					                arrData[i]['x']= {};
					                arrData[i]['x']= x;
					                arrData[i]['classname']= {};
					                arrData[i]['classname']= (parsediv[i]).className;
					                arrData[i]['data']= {};
					                arrData[i]['data'] = ((parsediv[i]).innerHTML);
							    }
						    }

						    arrData.sort(function(a, b) {
					            return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
					        });

						    var filtered = arrData.filter(function (el) {
					            return el != null;
					        });   



					        var htmldata2 = $('<html>');

					        
						    var arrData2 = [];

						    var currentIndex = 0;
						    var previousY = 0;

					        for (var j = 0; j < arrData.length; j++) {
					        	if (typeof arrData[j] != 'undefined') {
					        		if (j == 0) {
						    			previousY = y;
						    		}

						        	if (arrData[j].y != previousY) {
					                	currentIndex++;
					                }

					                var d = "";

					                if (arrData[j].classname.includes('json')) {
					                	d = JSON.parse(arrData[j].data);
					                } else {
					                	d = arrData[j].data;
					                }
               
					                if (typeof arrData2[currentIndex] == 'undefined') {
					                	arrData2[currentIndex] = [];
					                	arrData2[currentIndex].push(d);
					                } else {
					                	arrData2[currentIndex].push(d);
					                }
					               	
					            	previousY = arrData[j].y;
					        	}
					        }

					        var arrData3 = [];
					        var row = 0;
					        var currentY = 0;
							for (var k = 0; k < arrData2.length; k++) {
								
								if (typeof arrData2[k] !== 'undefined') {
									var h = "";

									if (typeof arrData2[k][0] === 'object') {
										var o = arrData2[k][0];

										for (const key in o) {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = key;
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = o[key];
											row++;
											currentY++;
											h = "<div><div style='float:left;'>" + key + "</div><div style='float:right; text-align:right;'>" + o[key] + "</div><div style='clear:both;'></div></div>";
											htmldata2.append(h);
										}

									} else if (arrData2[k].length == 1) {
										arrData3[row] = {};
										arrData3[row]['y'] = {};
										arrData3[row]['x'] = {};
										arrData3[row]['classname'] = {};
										arrData3[row]['data'] = {};
										arrData3[row]['y'] = currentY;
										arrData3[row]['data'] = arrData2[k][0];
										row++;
										currentY++;

										if (arrData2[k][0] == "") {
											h = "<div style='display: block; margin: 20px 0;'></div>";
										} else {
											h = "<div style='text-align:center; font-weight:bold;'>" + arrData2[k][0] + "</div>";
										}
										htmldata2.append(h);
									} else {
										if (arrData2[k][0] == "") {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
											h = "<div style='text-align:center; font-weight:bold;'>" + arrData2[k][1] + "</div>";
										} else {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][0];
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
											h = "<div><div style='float:left;'>" + arrData2[k][0] + "</div><div style='float:right; text-align:right;'>" + arrData2[k][1] + "</div><div style='clear:both;'></div></div>";
										}
										htmldata2.append(h);
									}
								}
							}

							htmldata2.find('div').css('font-size', '12px', 'important');
							htmldata2.find('div').css('font-family', 'Tahoma', 'important');
 

						    sortable = {
						    	content: arrData3, 
								filters: filters
								, created_dateTime: result[0].created_datetime
						    	, print_type: printType
								, z_count : zcount
						    	, width: parseInt((body.prevObject[0].style.width).replace("px", ""))
						    };

						  //   var params = {
								// action: 'printXOutZOut',
								// port: $window.location.port,
								// data: sortable
					   //  	};

					    	$('#xzout-preview-panel .preview').html(htmldata2.html());

					    	globalSortableXZoutPrintInfo = sortable;

						    // $http.post('plugins/eJournal/ejournal.php', params).then(function(result) {
					     //    	LoadingScreen.Enable = 0;
					     //    }, (err) => {
					     //    	LoadingScreen.Enable = 0;
					     //    });

					  //       var contain = base64.encode(htmldata.wrap('<p/>').parent().html());

					  //      	var dataBase64 = [
							// 	{
							// 		contain: contain,
							// 		print_type: printType
							// 	}
							// ];

					  //       generateSortableData(dataBase64, base64, 'xzout').then(sortable => {

						 //        ModelService.get('Store',{sid: session.storesid}).then(function(dataStore) {
							// 		var params = {
							// 			created_dateTime: result[0].created_datetime,
							// 			fromDate: filters.fromDate,
							// 			toDate: filters.toDate,
							// 			storeSid: session.storesid,
							// 			workstation: session.workstationid,
							// 			workstationNo: session.workstationnumber,
							// 			contain: contain,
							// 			printtype: printType, 
		     //    						sid: PCONTROLSID, 
		     //    						action: 'exportXOutZOut',
		     //    						exportType: type,
							//     		data: sortable,
							//     		storeName: dataStore[0].store_name,
							//     		zcount: data.zcount
							//     	};

							//     	$http.post('plugins/eJournal/ejournal.php', params).then(function(result){
							//         	console.log('Z-Out text file has been generated!');
							//         });
							// 	});

							// });	
											        
							// if (config_isXoutZoutPreviewEnabled) {
							// 	// var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						 //  //           iframeDocument.write(htmldata.html());
						 //  //           iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';

						 // 		var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						 //            iframeDocument.write(htmldata2.html());
						 //            iframedoc.style.height = "calc(" + iframeDocument.body.scrollHeight + 'px + 100px)';
							// } else {
								// var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						  //           iframeDocument.write(htmldata.html());
						  //           iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';	
							// }


						}
					});
				});
		    });
		}
	});
}


function directPrintXOutZOut(type, PCONTROLSID, session, printType, format, result, base64, ModelService, ModelService2, $http, LoadingScreen, $window, otherData) {
	LoadingScreen.Enable = 1;

	var params = [{
		"Params": {
			// "PMODE":"1",
			"PMODE":"2",
			"PCONTROLSID":PCONTROLSID,
			"PREPORTDATE":(new Date).toISOString(),
			"PSOURCE":null,
			"PDESTSBSNO":session.subsidiarysid,
			"PDATEFORMAT":null,
			"PDISCREPANCYLIST":null,
			"PNETCURRENCYTOT":null,
			"PNETNONCURRENCYTOT":null,
			"PCASHDROPAMT":null,
			"PUSERID":null,
			"PZREGISTERROWID":null,
			"PTRANSLATEDSTRINGS":null,
			"PDESIGNSID":format.data[0].sid,
			"PDESTINATION":"preview"
		},
		"MethodName":"GenerateXZOutReport"
	}];

	$.ajax({
        url: "plugins/afterPrint/ejournal.php"
        ,type: "POST"
        ,proccessData: false
        ,data: { 
        	datefrom: result[0].created_datetime, 
        	store: session.storesid, 
        	workstation: session.workstationid, 
        	printtype: printType, 
        	sid: PCONTROLSID, 
        	content: params, 
        	auth: sessionStorage.getItem("PRISMAUTH") 
        }
        ,success: function(data) {

			var content = JSON.parse(data);
			var contain = content.contain;
			var htmldata2 = base64.decode(contain);
			htmldata2 = $(htmldata2);

			htmldata2.find('div').each((index, elem) => {
				var className = $(elem).text().replace('value#', "");
				$(elem).addClass(className);
			});

			var htmldata = $('<html>').append(htmldata2);

			// if (!$('#separate-return-sequence').is(':checked') && type != 'zout') {
			// 	htmldata.find('.BEGINNING.RETURN').text('TOTAL SI');
			// 	htmldata.find('.transaction_counter_beginning_return').text('value#transaction_counter_total_si');
			// 	htmldata.find('.ENDING.RETURN').text('');
			// 	htmldata.find('.transaction_counter_ending_return').text('');
			// }

			var dynamicElements = $(htmldata).find('div#page1 div:contains("value#")');

			if (!config_isNetAmountRoundingOffEnabled) {
				$(htmldata).find('div#page1 div:contains("value#minus_net_round_amount")').remove();
				$(htmldata).find('div#page1 div:contains("MINUS")').remove();
				$(htmldata).find('div#page1 div:contains("NET ROUND AMOUNT")').remove();
			}
			
			var dynamicFields = {};
			dynamicElements.each((index, elem) => {
		    	dynamicFields[$(elem).text()] = 0.00;
		    });

			if (!$('#iframe-xout-zout-container').length) {
				// if (config_isXoutZoutPreviewEnabled) {
				// 	$('body').append('<div id="iframe-xout-zout-container"></div>');
				// } else {
					$('body').append('<div id="iframe-xout-zout-container" style="visibility: hidden; height: 0; overflow: hidden;"></div>');
				// }
			} else {
				$('#iframe-xout-zout-container').empty();
			}

			// 

			var iframedoc = document.createElement('iframe');
		    iframedoc.setAttribute('id', 'preview_frame0');
		    iframedoc.setAttribute('class', 'col-md-12');
		    iframedoc.setAttribute('scrolling', 'no');
		    iframedoc.style.border = 'none';
		    $('#iframe-xout-zout-container').append(iframedoc);

		    // GET ALL DYNAMIC VALUES
		    ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {

		    	ModelService.get('Workstation').then(function(dataWorkstations) {
				  	var allWorkstations = [];
				  	for (var i = 0; i < dataWorkstations.length; i++) {
				  		if (dataWorkstations[i].workstation_number != "") {
				  			allWorkstations.push(dataWorkstations[i].workstation_number);
				  		}
				  	}
				  	allWorkstations = allWorkstations.join();

				    if (type == 'xout') {
				    	var formFilter = $('#xOutForm');

				    	var workstationNo = session.workstationnumber;

				    	var workstation = formFilter.find('[ng-model="form.workstation"]').val();
				    		workstation = workstation.replace('string:', '');

				    	if (workstation == "") {
				    		workstation = 'all';
				    		workstationNo = 'all';
				    	} else {
				    		var tempWS = dataWorkstations.find(elem => elem.sid == workstation);
				    		workstationNo = tempWS.workstation_number;
				    	}

				    	var filters = {
					    	'fromDate': formFilter.find('input[ng-model="startDate.date"]').val(),
					    	'toDate': formFilter.find('input[ng-model="endDate.date"]').val(),
					    	'subsidiary': formFilter.find('#subsidiary').val().replace('string:', ''),
					    	'installation': formFilter.find('#installation').val().replace('string:', ''),
					    	'store': formFilter.find('#store').val().replace('string:', ''),
					    	'workstationNo': workstationNo,
					    	'drawer': formFilter.find('#drawer').val().replace('string:', ''),
					    	'till': formFilter.find('#till').val().replace('string:', ''),
					    	'cashier':  formFilter.find('#cashier').val().replace('string:', ''),
					    	'cashierName': emp[0].emplname,
					    	'cashierId': emp[0].emplid,
					    	'workstation': workstation,
					    	'allWorkstations': allWorkstations,
					    	...otherData
					    }

				    } else {
				    	var formFilter = $('#zoutSearchForm');
				    	var filters = zOutFilters;
				    }

				    $.ajax({
				    	url: 'plugins/afterPrint/XOutZOut.php',
				    	method: 'POST',
				    	data: {
				    		action: 'getDynamicValuesXOutZOut',
				    		fields: dynamicFields,
				    		filters: filters,
				    		config_settingsVersion: config_settingsVersion_xzout
				    	},
				    	success: function(data) {
				    		var data = JSON.parse(data);	

				    		dynamicElements.each((index, elem) => {

				    			if (data.data[$(elem).text()] == 'empty value') {
				    				$(elem).remove();
				    			} else {

				    				if (typeof data.data[$(elem).text()] === 'object') {
				    					$(elem).html(JSON.stringify(data.data[$(elem).text()])).addClass('json');
				    				} else {
				    					$(elem).html(data.data[$(elem).text()]);
				    				}
				    			}
						    });

						    htmldata.find('div#page1 > div').css('font-size', '12px', 'important');
							htmldata.find('div#page1 > div').css('font-family', 'Tahoma', 'important');

						    var body = angular.element(htmldata).find('page1');
						    divdata = body.prevObject;
						    parsediv = angular.element(divdata).find('div');

						    var sortable = [];

						    var arrData = [];

						    for (var i = 1; i<=parsediv.length; i++) {

						    	if (typeof parsediv[i] != 'undefined' ) {
				                	var y = parseInt((parsediv[i].style.top).replace("px",""));
					                var x = parseInt((parsediv[i].style.left).replace("px",""));
					                
					                arrData[i] = {};
					                arrData[i]['y']= {};
					                arrData[i]['y']= y;
					                arrData[i]['x']= {};
					                arrData[i]['x']= x;
					                arrData[i]['classname']= {};
					                arrData[i]['classname']= (parsediv[i]).className;
					                arrData[i]['data']= {};
					                arrData[i]['data'] = ((parsediv[i]).innerHTML);
							    }
						    }

						    arrData.sort(function(a, b) {
					            return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
					        });

						    var filtered = arrData.filter(function (el) {
					            return el != null;
					        });   



					        var htmldata2 = $('<html>');

					        
						    var arrData2 = [];

						    var currentIndex = 0;
						    var previousY = 0;

					        for (var j = 0; j < arrData.length; j++) {
					        	if (typeof arrData[j] != 'undefined') {
					        		if (j == 0) {
						    			previousY = y;
						    		}

						        	if (arrData[j].y != previousY) {
					                	currentIndex++;
					                }

					                var d = "";

					                if (arrData[j].classname.includes('json')) {
					                	d = JSON.parse(arrData[j].data);
					                } else {
					                	d = arrData[j].data;
					                }
               
					                if (typeof arrData2[currentIndex] == 'undefined') {
					                	arrData2[currentIndex] = [];
					                	arrData2[currentIndex].push(d);
					                } else {
					                	arrData2[currentIndex].push(d);
					                }
					               	
					            	previousY = arrData[j].y;
					        	}
					        }

					        var arrData3 = [];
					        var row = 0;
					        var currentY = 0;
							for (var k = 0; k < arrData2.length; k++) {
								
								if (typeof arrData2[k] !== 'undefined') {
									var h = "";

									if (typeof arrData2[k][0] === 'object') {
										var o = arrData2[k][0];

										for (const key in o) {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = key;
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = o[key];
											row++;
											currentY++;
											h = "<div><div style='float:left; margin-left: 20px;'>" + key + "</div><div style='float:right; text-align:right;'>" + o[key] + "</div><div style='clear:both;'></div></div>";
											htmldata2.append(h);
										}

									} else if (arrData2[k].length == 1) {
										arrData3[row] = {};
										arrData3[row]['y'] = {};
										arrData3[row]['x'] = {};
										arrData3[row]['classname'] = {};
										arrData3[row]['data'] = {};
										arrData3[row]['y'] = currentY;
										arrData3[row]['data'] = arrData2[k][0];
										row++;
										currentY++;

										if (arrData2[k][0] == "") {
											h = "<div style='display: block; margin: 20px 0;'></div>";
										} else {
											h = "<div style='text-align:center; font-weight:bold;'>" + arrData2[k][0] + "</div>";
										}
										htmldata2.append(h);
									} else {
										if (arrData2[k][0] == "") {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
											h = "<div style='text-align:center; font-weight:bold;'>" + arrData2[k][1] + "</div>";
										} else {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][0];
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = {};
											arrData3[row]['classname'] = {};
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
											h = "<div><div style='float:left;'>" + arrData2[k][0] + "</div><div style='float:right; text-align:right;'>" + arrData2[k][1] + "</div><div style='clear:both;'></div></div>";
										}
										htmldata2.append(h);
									}
								}
							}

							htmldata2.find('div').css('font-size', '12px', 'important');
							htmldata2.find('div').css('font-family', 'Tahoma', 'important');
 

						    sortable = {
						    	content: arrData3, 
						    	print_type: printType, 
						    	width: parseInt((body.prevObject[0].style.width).replace("px", ""))
						    };

						    var params = {
								action: 'printXOutZOut',
								port: $window.location.port,
								data: sortable
					    	};

						    $http.post('plugins/eJournal/ejournal.php', params).then(function(result) {
					        	LoadingScreen.Enable = 0;
					        }, (err) => {
					        	LoadingScreen.Enable = 0;
					        });

					  //       var contain = base64.encode(htmldata.wrap('<p/>').parent().html());

					  //      	var dataBase64 = [
							// 	{
							// 		contain: contain,
							// 		print_type: printType
							// 	}
							// ];

					  //       generateSortableData(dataBase64, base64, 'xzout').then(sortable => {

						 //        ModelService.get('Store',{sid: session.storesid}).then(function(dataStore) {
							// 		var params = {
							// 			created_dateTime: result[0].created_datetime,
							// 			fromDate: filters.fromDate,
							// 			toDate: filters.toDate,
							// 			storeSid: session.storesid,
							// 			workstation: session.workstationid,
							// 			workstationNo: session.workstationnumber,
							// 			contain: contain,
							// 			printtype: printType, 
		     //    						sid: PCONTROLSID, 
		     //    						action: 'exportXOutZOut',
		     //    						exportType: type,
							//     		data: sortable,
							//     		storeName: dataStore[0].store_name,
							//     		zcount: data.zcount
							//     	};

							//     	$http.post('plugins/eJournal/ejournal.php', params).then(function(result){
							//         	console.log('Z-Out text file has been generated!');
							//         });
							// 	});

							// });	
											        
							// if (config_isXoutZoutPreviewEnabled) {
								// var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						  //           iframeDocument.write(htmldata.html());
						  //           iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';

						 // 		var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						 //            iframeDocument.write(htmldata2.html());
						 //            iframedoc.style.height = "calc(" + iframeDocument.body.scrollHeight + 'px + 100px)';
							// } else {
								// var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						  //           iframeDocument.write(htmldata.html());
						  //           iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';	
							// }
						}
					});
				});
		    });
		}
	});
}

// Copy notes general from return receipt to the current transaction
var zoutControllerSaveHandler = ['ModelEvent', 'ModelService', 'authService', '$uibModal', 'prismSessionInfo', 'base64', 'ModelService2', '$http', 'LoadingScreen', '$window', '$location', 'NotificationService',
	function(ModelEvent, ModelService, authService, $uibModal, prismSessionInfo, base64, ModelService2, $http, LoadingScreen, $window, $location, NotificationService){

    // Event handler to capture after item insert in the current document
    var afterZOutControlSave = function($q, zoutcontrol) {
        var deferred = $q.defer();

	// alert();
	currentZOutSID = zoutcontrol.sid;

	console.log(zoutcontrol.status);
        if (zoutcontrol.status == 2) {

        	// console.log(zoutcontrol);

        	currentZOutSID = zoutcontrol.sid;

        	var session = prismSessionInfo.get();

			$.ajax({
				url: 'plugins/ejournal/dumping.php',
	            method: 'GET',
	            data: { 
	            	action: 'closeDrawerDumping',
	            	subsidiaryNo: session.subsidiarynumber
	           	}
			});

        	ModelService.get('ZoutControl',{sid:zoutcontrol.sid, cols:'*'}).then(function(zcontrolData) {
        		var zOut = zcontrolData[0];
        		

        		ModelService2.get('Employee', {sid:zOut.cashier_sid}).then(function(emp2) {

			   		var work = "all";
			   		if (zOut.workstation_sid != null && zOut.workstation_sid != "") {
			   			work = zOut.workstation_sid;
			   		}

			   		var workNo = "";
			   		if (zOut.workstation_number != null && zOut.workstation_number != "") {
			   			workNo = zOut.workstation_number;
			   		}

					zOutFilters = {
						'fromDate': zOut.period_begin,
						'toDate': zOut.period_end,
						'subsidiary': '',
						'installation': '',
						'store': '',
						'workstation': work,
						'workstationNo': workNo,
						'allWorkstations': zOutAllWorkstations,
						'drawer': '',
						'till': '',
						'cashier': '',
						'cashierName': emp2[0].emplname,
						'cashierId': emp2[0].emplid,
						'sequence': zOut.sequence,
						'sbsNo': session.subsidiarynumber,
						'storeNo': session.storenumber
					}

					var PCONTROLSID = zOut.sid;
					var path = $location.path().toString();

					if (config_settingsVersion_xzout == 'v3') {
						$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v3 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
							var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v3, NotificationService);

							if (transform_deisgn_validation) {
			        			processXOutZOut('zout', PCONTROLSID, session, 6, format, zOut, base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
									generateEjournalPerDay(zOut.period_begin, ModelService, $http, base64);
								});
							}
						});
					} else {
						$http.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_ZOUT_v2 + ')AND(resource_name,eq,ZOUTCONTROL)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
							var transform_deisgn_validation = xzout_check_transform_design(format, config_docDesign_ZOUT_v2, NotificationService);

							if (transform_deisgn_validation) {
			        			processXOutZOut('zout', PCONTROLSID, session, 6, format, zOut, base64, ModelService, ModelService2, $http, 'print', path, true).then(() => {
									generateEjournalPerDay(zOut.period_begin, ModelService, $http, base64);
								});
							}
						});
					}
				   	
				});

        	});

        }

        deferred.resolve();
          
        return deferred.promise;
    };

    ModelEvent.addListener('ZOutControl', 'onAfterSave', afterZOutControlSave);
}]

ConfigurationManager.addHandler(zoutControllerSaveHandler);

ButtonHooksManager.addHandler(['after_posTenderTake', 'after_posTenderGive'],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService) {
    	var deferred = $q.defer();
    	var docSid = $stateParams.document_sid;

		

		setTimeout(() => {
			$http.get('v1/rest/document/' + docSid + '/tender', {
			headers: { "Auth-Session": sessionStorage.getItem("PRISMAUTH") },
			params: {
				cols: '*',
				sort: 'created_datetime,desc'
			}
			}).then(function(tender) {	
				let item = tender.data[0];
				console.log(item);
				let tender_sid = item.sid;
				let tender_type = item.tender_type;

				if(tender_type == 2) {
					let card_no = $('#cardNo')[0].value;

					
					// document.getElementById("tender_card_number"); 
					// let c = k = card_no;
	
					$.ajax({
						url: 'plugins/afterPrint/updateTender.php',
						method: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({
							card_no: card_no,
							tender_sid: tender_sid
						}),
						success: function(response) {
							setTimeout(() => {
								$('#tender_card_number').html(card_no);
							}, 100);
						},
					});
				}
			});
		}, 1000);

    	return deferred.promise;
	}
);
