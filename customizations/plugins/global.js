var globalSortableXZoutPrintInfo = {};

function forEachWithCallback(callback) {
    const arrayCopy = this;
    let index = 0;
    const next = () => {
        index++;
        if (arrayCopy.length > 0) {
            callback(arrayCopy.shift(), index, next);
        }
    }
    next();
}

Array.prototype.forEachWithCallback = forEachWithCallback;



function processXOutZOut(type, PCONTROLSID, session, printType, format, result, base64, ModelService, ModelService2, $http, mode, path, isReturnSeparateSequence, otherData = {}) {
	return new Promise(function(resolve, reject) {
		var params = [{
			"Params": {
				"PMODE":"1",
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
	        	datefrom: result.created_datetime, 
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

				var form = $('#printDialogueForm');
				if ($('#out-preview').length) {
	    			$('#out-preview').empty();

	    			if (mode == 'preview') {
	    				$('#out-preview').show();
	    			} else {
	    				$('#out-preview').hide();
	    			}
	    		} else {
	    			if (mode == 'preview') {
	    				form.find('.modal-body').append('<div id="out-preview"></div>');
	    			} else {
	    				form.find('.modal-body').append('<div id="out-preview" style="display: none;"></div>');
	    			}
	    		}

	    		var iframedoc = document.createElement('iframe');
			    iframedoc.setAttribute('id', 'preview_frame0');
			    iframedoc.setAttribute('class', 'col-md-12');
			    iframedoc.setAttribute('scrolling', 'no');
			    iframedoc.style.border = 'none';
			    $('#out-preview').append(iframedoc);

			    var htmldata2 = base64.decode(contain);
				htmldata2 = $(htmldata2);

				htmldata2.find('div').each((index, elem) => {
					var className = $(elem).text().replace('value#', "");
					$(elem).addClass(className);
				});

				var htmldata = $('<html>').append(htmldata2);

				if (!isReturnSeparateSequence) {
					htmldata.find('.BEGINNING.RETURN').text('TOTAL SI');
					htmldata.find('.transaction_counter_beginning_return').text('value#transaction_counter_total_si');
					htmldata.find('.ENDING.RETURN').text('');
					htmldata.find('.transaction_counter_ending_return').text('');
				}

				var dynamicElements = $(htmldata).find('div#page1 div:contains("value#")');

			    var dynamicFields = {};

			    dynamicElements.each((index, elem) => {
			    	dynamicFields[$(elem).text()] = 0.00;
			    });

			    var filters = {};

			    ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {

				    if (path.includes('xout')) {
				    	var formFilter = $('#xOutForm');

				    	var filters = {
					    	'fromDate': formFilter.find('input[ng-model="startDate.date"]').val(),
					    	'toDate': formFilter.find('input[ng-model="endDate.date"]').val(),
					    	'subsidiary': formFilter.find('#subsidiary').val().replace('string:', ''),
					    	'installation': formFilter.find('#installation').val().replace('string:', ''),
					    	'store': formFilter.find('#store').val().replace('string:', ''),
					    	'workstation': formFilter.find('#workstation').val().replace('string:', ''),
					    	'workstationNo': session.workstationnumber,
					    	'drawer': formFilter.find('#drawer').val().replace('string:', ''),
					    	'till': formFilter.find('#till').val().replace('string:', ''),
					    	'cashier':  formFilter.find('#cashier').val().replace('string:', ''),
					    	'cashierName': emp[0].emplname,
					    	'cashierId': emp[0].emplid,
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
				    			// console.log(data.data[$(elem).text()]);
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

				    		if (mode == 'preview') {
				    			// var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
						     //        iframeDocument.write(htmldata.html());
						     //        iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';
				    		}

					        if (mode == 'print') {
					        	var contain = base64.encode(htmldata.wrap('<p/>').parent().html());

						       	var dataBase64 = [
									{
										contain: contain,
										print_type: printType
									}
								];

						        generateSortableData(dataBase64, base64, 'xzout').then(sortable => {
									let res = Array.isArray(result) ? result[0] : result;
									let workstation_no = res.workstation_no ? res.workstation_no : res.workstation_number;

									ModelService.get('Store',{sid: res.store_sid}).then(function(dataStore) {
										var params = {
											fromDate: formFilter.find('input[ng-model="startDate.date"]').val(),
											toDate: formFilter.find('input[ng-model="endDate.date"]').val(),
											created_dateTime: res.period_end,
											storeSid: res.store_sid,
											workstation: res.workstation_sid,
											workstationNo: workstation_no,
											contain: contain,
											printtype: printType, 
			        						sid: PCONTROLSID, 
			        						action: 'exportXOutZOut',
			        						exportType: type,
								    		data: sortable,
								    		storeName: dataStore[0].store_name,
								    		zcount: data.zcount
								    	};

								    	$http.post('plugins/eJournal/ejournal.php', params).then(function(result){
								        	console.log('Z-Out text file has been generated!');
								        	resolve(true);
								        });
									});
						        });
					        }
				    	},
				    	error: function(data) {

				    	}
				    });

			    });
			}
	    });
	});
}


function generateSortableData(payloads, base64, type) {
	return new Promise(function(resolve, reject) {
		var sortable = [];

		if (!$('#ejournal-receipt-iframe').length) {
			$('body').append('<div id="ejournal-receipt-iframe" style="display: none;"></div>');
		} else {
			$('#ejournal-receipt-iframe').empty();
		}

		angular.forEach(payloads, function(val, key) {
		    var iframedoc = document.createElement('iframe');
		    iframedoc.setAttribute('id', 'preview_frame1');
		    iframedoc.setAttribute('class', 'col-md-12');
		    iframedoc.setAttribute('scrolling', 'no');
		    iframedoc.style.border = 'none';
		    $('#ejournal-receipt-iframe').append(iframedoc);
		    var htmldata = base64.decode(val.contain);
		    var body = angular.element(htmldata).find('page1');
		    divdata = body.prevObject;
		    parsediv = angular.element(divdata).find('div');

		    for (var i = 2; i<=parsediv.prevObject.length; i+=4) {

		        var body1 = angular.element(parsediv.prevObject[i]).find('page1');
		        divdata1 = body1.prevObject[0].innerHTML;
		        parsediv1 = angular.element(divdata1).find('div');
		        var j = 0;
		        var arrData = [];
		        for (j = 1; j<=parsediv1.prevObject.length; j++) {

		            if(parsediv1.prevObject[j] !== undefined ){

		                var y = parseInt((parsediv1.prevObject[j].style.top).replace("px",""));
		                var x = parseInt((parsediv1.prevObject[j].style.left).replace("px",""));

		                arrData[j] = {};
		                arrData[j]['y']= {};
		                arrData[j]['y']= y;
		                arrData[j]['x']= {};
		                arrData[j]['x']= x;
		                arrData[j]['classname']= {};
		                arrData[j]['classname']= (parsediv1.prevObject[j]).className;
		                arrData[j]['data']= {};
		                arrData[j]['data'] = ((parsediv1.prevObject[j]).innerText);
		            }

		        }

		        arrData.sort(function(a, b) {
		            return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
		        });
		        var filtered = arrData.filter(function (el) {
		            return el != null;
		        });

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
		        var currentY = 1;
				for (var k = 0; k < arrData2.length; k++) {
					
					if (typeof arrData2[k] !== 'undefined') {
						var h = "";

						if (typeof arrData2[k][0] === 'object') {
							var o = arrData2[k][0];

							for (const key in o) {
								arrData3[row] = {};
								arrData3[row]['y'] = {};
								arrData3[row]['x'] = 0;
								arrData3[row]['classname'] = "";
								arrData3[row]['data'] = {};
								arrData3[row]['y'] = currentY;
								arrData3[row]['data'] = key;
								row++;
								arrData3[row] = {};
								arrData3[row]['y'] = {};
								arrData3[row]['x'] = 0;
								arrData3[row]['classname'] = "";
								arrData3[row]['data'] = {};
								arrData3[row]['y'] = currentY;
								arrData3[row]['data'] = o[key];
								row++;
								currentY++;
							}

						} else if (arrData2[k].length == 1) {
							arrData3[row] = {};
							arrData3[row]['y'] = {};
							arrData3[row]['x'] = 0;
							arrData3[row]['classname'] = "";
							arrData3[row]['data'] = {};
							arrData3[row]['y'] = currentY;
							arrData3[row]['data'] = arrData2[k][0];
							row++;
							currentY++;

						} else {
							if (arrData2[k][0] == "") {
								arrData3[row] = {};
								arrData3[row]['y'] = {};
								arrData3[row]['x'] = 0;
								arrData3[row]['classname'] = "";
								arrData3[row]['data'] = {};
								arrData3[row]['y'] = currentY;
								arrData3[row]['data'] = arrData2[k][1];
								row++;
								currentY++;
							} else {
								arrData3[row] = {};
								arrData3[row]['y'] = {};
								arrData3[row]['x'] = 0;
								arrData3[row]['classname'] = "";
								arrData3[row]['data'] = {};
								arrData3[row]['y'] = currentY;
								arrData3[row]['data'] = arrData2[k][0];
								row++;
								arrData3[row] = {};
								arrData3[row]['y'] = {};
								arrData3[row]['x'] = 0;
								arrData3[row]['classname'] = "";
								arrData3[row]['data'] = {};
								arrData3[row]['y'] = currentY;
								arrData3[row]['data'] = arrData2[k][1];
								row++;
								currentY++;
							}
						}
					}
				}

				var content = arrData3;
				if (type == 'receipt') {
					content = filtered;
				}

		        sortable.push({content: content, print_type: val.print_type, width: parseInt((body1.prevObject[0].style.width).replace("px", ""))});
		    }

		    if (key + 1 == payloads.length) {
		    	resolve(sortable);
		    }
		});

	});
}

function storeReceipt(res, design, printType, base64, $http, ModelService, transactionType, receiptType) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			url: "plugins/afterPrint/ejournal.php"
			,type: "POST"
			,data: { 
				datefrom:res.created_datetime, 
				store: res.store_uid, 
				workstation: res.workstation_uid, 
				printtype: printType,
				sid:res.sid, 
				design: design.sid, 
				auth:sessionStorage.getItem("PRISMAUTH"),
				transactionType: transactionType,
				receiptType: receiptType
			}
			,success: function(data){
				var content = JSON.parse(data);

				if (content.success) {
					var contain = content.contain;

					var data = [
						{
							contain: contain,
							print_type: printType
						}
					];

					generateSortableData(data, base64, 'receipt').then(sortable => {
						var session = JSON.parse(sessionStorage.getItem('session'));

						ModelService.get('Store',{sid: session.storesid}).then(function(data) {
							var params = {
					    		data: sortable, 
					    		action: 'exportReceipt', 
					    		docSid: res.sid,
					    		storeName: data[0].store_name,
					    		created_dateTime: res.created_datetime,
					    		exportType: 'perTransaction',
					    		docNo: res.document_number,
					    	};

					    	$http.post('plugins/eJournal/ejournal.php', params).then(function(result){
					    		generateEjournalPerDay(res.created_datetime, ModelService, $http, base64);
					    		resolve(true);
					        	//console.log('Receipt has been stored into a text file.');
					        });
						});
					});
				} else {
					resolve(false);
				}
			}
		});
	});
}

function generateEjournalPerDay(specDate = 'all', ms, http, base64) {
	var sortable = [];

	if (specDate != 'all') {
		specDate = specDate.split('T')[0];
	}

	$.ajax({
		url: 'plugins/eJournal/GetEjournalPerDay.php',
		data: { date: specDate },
        method: 'GET',
        success: function(result) {

            var len = result.length;

            result.forEachWithCallback((el, i, next) => {

                var len2 = el.length;

                sortable = [];

                var storeSid = null;
                var date = null;

                el.forEachWithCallback((el2, i2, next2) => {

                    if (i2 == 1) {
                        storeSid = el2;
                    }

                    if (i2 == 2) {
                        date = el2;
                    }

                    if (i2 > 2) {
                        var iframedoc = document.createElement('iframe');
                        iframedoc.setAttribute('id', 'preview_frame' + i + i2);
                        iframedoc.setAttribute('class', 'col-md-12');
                        iframedoc.setAttribute('scrolling', 'no');
                        iframedoc.style.border = 'none';
                        $('body .modal-body .row .col-md-8').append(iframedoc);
                        var htmldata = base64.decode(el2.contain);
                        var body = angular.element(htmldata).find('page1');
                        divdata = body.prevObject;
                        parsediv = angular.element(divdata).find('div');

                        for (var i = 2; i<=parsediv.prevObject.length; i+=4) {

                            var body1 = angular.element(parsediv.prevObject[i]).find('page1');
                            divdata1 = body1.prevObject[0].innerHTML;
                            parsediv1 = angular.element(divdata1).find('div');
                            var j = 0;
                            var arrData = [];
                            for (j = 1; j<=parsediv1.prevObject.length; j++) {

                                if(parsediv1.prevObject[j] !== undefined ){

                                    var y = parseInt((parsediv1.prevObject[j].style.top).replace("px",""));
                                    var x = parseInt((parsediv1.prevObject[j].style.left).replace("px",""));

                                    arrData[j] = {};
                                    arrData[j]['y']= {};
                                    arrData[j]['y']= y;
                                    arrData[j]['x']= {};
                                    arrData[j]['x']= x;
                                    arrData[j]['classname']= {};
                                    arrData[j]['classname']= (parsediv1.prevObject[j]).className;
                                    arrData[j]['data']= {};
                                    arrData[j]['data'] = ((parsediv1.prevObject[j]).innerText);
                                }

                            }

                            arrData.sort(function(a, b) {
                                return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
                            });
                            var filtered = arrData.filter(function (el) {
                                return el != null;
                            });

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
					        var currentY = 1;
							for (var k = 0; k < arrData2.length; k++) {
								
								if (typeof arrData2[k] !== 'undefined') {
									var h = "";

									if (typeof arrData2[k][0] === 'object') {
										var o = arrData2[k][0];

										for (const key in o) {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = 0;
											arrData3[row]['classname'] = "";
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = key;
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = 0;
											arrData3[row]['classname'] = "";
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = o[key];
											row++;
											currentY++;
										}

									} else if (arrData2[k].length == 1) {
										arrData3[row] = {};
										arrData3[row]['y'] = {};
										arrData3[row]['x'] = 0;
										arrData3[row]['classname'] = "";
										arrData3[row]['data'] = {};
										arrData3[row]['y'] = currentY;
										arrData3[row]['data'] = arrData2[k][0];
										row++;
										currentY++;

									} else {
										if (arrData2[k][0] == "") {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = 0;
											arrData3[row]['classname'] = "";
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
										} else {
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = 0;
											arrData3[row]['classname'] = "";
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][0];
											row++;
											arrData3[row] = {};
											arrData3[row]['y'] = {};
											arrData3[row]['x'] = 0;
											arrData3[row]['classname'] = "";
											arrData3[row]['data'] = {};
											arrData3[row]['y'] = currentY;
											arrData3[row]['data'] = arrData2[k][1];
											row++;
											currentY++;
										}
									}
								}
							}

							var content = arrData3;
							if (el2.type == 'document') {
								content = filtered;
							}

                            sortable.push({content: content, width: parseInt((body1.prevObject[0].style.width).replace("px", ""))});

                        }
                    }

                    if (i2 == len2) {
                        if (storeSid) {
                            ms.get('Store',{sid: storeSid}).then(function(data) {
                                var params = {
                                    data: sortable, 
                                    action: 'exportReceipt',
                                    exportType: 'summary',
                                    date: date,
                                    storeName: data[0].store_name
                                };

                                http.post('plugins/eJournal/ejournal.php', params).then(function(result){
                                    next();
                                });
                            });
                        } else {
                            next();
                        }
                    } else {
                        next2();
                    }
                });

                if (i == len) {
                    // LoadingScreen.Enable = 0;
                }
            });

        }
    });
}