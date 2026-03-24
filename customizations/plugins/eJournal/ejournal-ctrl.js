var ejournal = ["ModelService2", "$scope", "$http", "prismSessionInfo", "$location", "$uibModalInstance", "$uibModal", "XZOutReporter", "$state", "base64","$q","PrintersService","PrismUtilities","ModelService","$filter","$window", "LoadingScreen", "NotificationService",
function(ModelService2, a, b, c, d, e, f, k, m, n, o, ps, pu, ms, $filter,$window,LoadingScreen, NotificationService) {

    a.sortable = [];
    a.isExport = true;
    a.totalRecords = 0;

//design list
b.get('/v1/rest/transformdesign?cols=design_name,sid&filter=resource_name,eq,document&sort=design_name,asc',{headers:{"Auth-Session": sessionStorage.getItem("PRISMAUTH")}})
.then(function(res){
    a.designs = res.data;
    a.search.designList = a.designs[0];
});

//printer list
//  a.loadPrinter = function(){
//    var b = o.defer();
//    ps.getList("", "sid,printername", "printername,ASC").then(function(a){
//      b.resolve(pu.responseParser(a));
//    });
//
//    return b.promise;
//  }
//
//  a.loadPrinter().then(function(res){
//    a.printers = res;
//  })

var nDate = new Date();
a.tDate = $filter('date')(nDate,'MM/dd/yyyy');
a.Date = $filter('date')(nDate.setDate(nDate.getDate()-7),'MM/dd/yyyy');


a.transType = [
{name:"All",filter:"((document_number,nn)OR(order_document_number,nn))"},
{name:"Sale",filter:"(has_sale,eq,true)"},
{name:"Orders",filter:"(order_document_number,nn)"},
{name:"Customer Order",filter:"(order_type,eq,0)"},
{name:"Layaway",filter:"(order_type,eq,2)"},
{name:"Send Sale",filter:"((order_type,eq,6)+OR(send_sale_fulfillment,eq,true))"}
];


ms.get('Store',{cols:'sid,store_name',filter:'(subsidiary_sid,eq,' + c.get().subsidiarysid + ')AND(active,eq,true)&sort=store_code,asc'})
.then(function(s){
    a.stores = s;
});

ms.get('Workstation',{cols:'sid,workstation_name',filter:'(subsidiary_sid,eq,' + c.get().subsidiarysid + ')AND(active,eq,true)&sort=workstation_name,asc'})
.then(function(w){
    a.workstations = w;
});

a.closeModal = function(){
    e.dismiss();
}

a.processDoc = function(sid,receipt_type){
    var deferred = o.defer();
//      console.log(receipt_type);
if(receipt_type == '0' || receipt_type == '2'){ //REGULAR
    b.get('v1/rest/document/transform/455465961000111149?filter=(SID,eq,'+ sid +')&type=preview&sort=document_number,%20asc',
        {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(res){
            deferred.resolve(res);
        });
} else if(receipt_type == '1'){ //RETURN
    b.get('v1/rest/document/transform/455466340000192151?filter=(SID,eq,'+ sid +')&type=preview&sort=document_number,%20asc',
        {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(res){
            deferred.resolve(res);
        });
    }

    return deferred.promise;
}



a.previewBtn = function(){
    LoadingScreen.Enable = 1;
    $('body .modal-body .row .col-md-8').html('');
    var from_date = $filter('date')(new Date(a.search.fromDate),'yyyy-MM-dd');

    var dbDate = new Date(a.search.toDate);
    var to_date = $filter('date')(dbDate.setDate(dbDate.getDate()),'yyyy-MM-dd');

    var sFilter = "(DATE(created_date) between '" + from_date + "'";

    sFilter += "AND '" + to_date + "')";

    if(a.search.storeList){
        sFilter += "AND(store_sid = '" + a.search.storeList.sid + "')";
    }
    if(a.search.workstationList){
        sFilter += "AND(ws_sid = '" + a.search.workstationList.sid + "')";
    }

// console.log(sFilter);
// sFilter += " AND el_printtype in (1, 2, 3, 4, 5, 6)";

//--EXPORT
var recSizeStd = 40;
z = 0;
var y = 0;
b.post('plugins/eJournal/getdata.php', { filter: sFilter}).then(function(result){
    if(result.data.length == 0){
        LoadingScreen.Enable = 0;
        NotificationService.addAlert('No record found !', 'Information', 'static', false);
    }
    else{
        var error_count = 0;

        angular.forEach(result.data, function(val, key) {
            var iframedoc = document.createElement('iframe');
            iframedoc.setAttribute('id', 'preview_frame1');
            iframedoc.setAttribute('class', 'col-md-12');
            iframedoc.setAttribute('scrolling', 'no');
            iframedoc.style.border = 'none';
            $('body .modal-body .row .col-md-8').append(iframedoc);
            var htmldata = n.decode(val.contain);
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
				if (val.type == 'receipt') {
					content = filtered;
				}

                a.sortable.push({content: content, print_type: val.print_type, width: parseInt((body1.prevObject[0].style.width).replace("px", ""))});

            }

            if (val.contain != "") {
                var iframeDocument = iframedoc.contentDocument || iframedoc.contentWindow.document;
                iframeDocument.write(htmldata);
                iframedoc.style.height = iframeDocument.body.scrollHeight + 'px';
            } else {
                error_count += 1;
            }

            if(key == result.data.length - 1 && result.data.length > 0)
            {
                a.isExport = false;
                a.totalRecords = result.data.length - error_count;
                if (error_count) {
                    console.log('E-Journal: There are/is error(s) found. Unrecorded record - ' + error_count);
                }
                LoadingScreen.Enable = 0;
            }
        });
    }

});

};

a.pads = function(input, padLength, padString, padType){

    var half = '';
    var padToGo;

    var _strPadRepeater = function (s, len) {
        var collect = '';

        while (collect.length < len) {
            collect += s;
        }
        collect = collect.substr(0, len)

        return collect;
    }

    input += '';
    padString = padString !== undefined ? padString : ' ';

    if (padType !== 'STR_PAD_LEFT' && padType !== 'STR_PAD_RIGHT' && padType !== 'STR_PAD_BOTH') {
        padType = 'STR_PAD_RIGHT';
    }
    if ((padToGo = padLength - input.length) > 0) {
        if (padType === 'STR_PAD_LEFT') {
            input = _strPadRepeater(padString, padToGo) + input;
        } else if (padType === 'STR_PAD_RIGHT') {
            input = input + _strPadRepeater(padString, padToGo);
        } else if (padType === 'STR_PAD_BOTH') {
            half = _strPadRepeater(padString, Math.ceil(padToGo / 2));
            input = half + input + half;
            input = input.substr(0, padLength);
        }
    }

    return input;
}

a.processApiPost = function(doc){
    var deferred = o.defer();

    b.get('v1/rest/document/transform/' + a.search.designList.sid + '?filter=(SID,eq,'+ doc._sid +')&type=preview&sort=item.ENHANCED_ITEM_POS,%20desc',
        {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(res){

            var data = {
                invoicePostedDate: doc._invoice_posted_date,
                sid: doc._sid,
                documentNumber: doc._document_number,
                eftInvoiceNumber: doc._eft_invoice_number,
                orderDocumentNumber: doc._order_document_number,
                orderQty: doc._order_qty,
                soldQty: doc._sold_qty,
                storeNumber: doc._store_number,
                transactionTotalAmount: doc._transaction_total_amt,
                btFirstName: doc._bt_first_name,
                btLastName: doc._bt_last_name,
                has_sale: doc._has_sale,
                order_type: doc._order_type,
                link:doc.link,
                row_version:doc.row_version,
                invoiceDetails: n.decode(res.data[0].payload)
            };

            deferred.resolve(data);
        });

        return deferred.promise;
    }

    a.syncDocuments = function(){

        var searchFilter = {
            cols:'row_version,has_sale,pos_flag3,status,bt_first_name,bt_last_name,invoice_posted_date,document_number,cashier_login_name,order_qty,return_qty,sid,sold_qty,tender_name,transaction_total_amt,row_version,order_document_number,send_sale_status,order_status,send_sale_fulfillment,item.order_quantity_filled,item.order_type,receipt_type,order_type,store_number,eft_invoice_number',
            filter:'status,eq,4',
            sort:'document_number,desc'
        };

        ms.get('Document',searchFilter).then(function(res){
            a.document_list = res;

            var docData = "[{\"pos_flag3\":\"Printed\"}]";

            for (var key in a.document_list) {
                if (a.document_list.hasOwnProperty(key)) {

                    if(!a.document_list[key]['pos_flag3']){
                        a.processApiPost(a.document_list[key] ).then(function(data){
                            b.post('https://localhost:8000/api/invoices',data)
                            .then(function(r){
                                b.put(r.data.link +'?filter=row_version,eq,'+r.data.row_version,docData,
                                    {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}})
                                .then(function(resDoc){
                                    console.log(resDoc);
                                });
                            });
                        });
                    }else{
                        console.log('Exist: ' + a.document_list[key]['sid']);
                    }
                }
            }
        });

    }

    a.exportContent = function(){

        var session = JSON.parse(sessionStorage.getItem('session'));

        ms.get('Store',{sid: session.storesid}).then(function(data) {

            var params = {
                data: a.sortable, 
                action: 'exportReceipt',
                exportType: 'summary',
                storeName: data[0].store_name
            };

            b.post('plugins/eJournal/ejournal.php', params).then(function(result){
                var jsonResult = JSON.parse(result.data);
                var link = document.createElement('a');
                var mimeType = 'text/plain';

                link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8;base64,' + jsonResult.data);
                link.setAttribute('download', jsonResult.filename);
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                k.go(k.current, {}, {reload: true});
            });
        });
    }

    a.processAll = function(){
        var from_date = $filter('date')(new Date(a.search.fromDate),'yyyy-MM-dd');
        var to_date = $filter('date')(new Date(a.search.toDate),'yyyy-MM-dd');

        var ans = confirm('This will process all unjournaled transactions and zout and may take a while. Are you sure you want to proceed?');
        if (ans) {
            LoadingScreen.Enable = 1;

            var session = c.get();

            var path = d.path().toString();

            ModelService2.get('Employee', {sid:session.employeesid}).then(function(emp) {
                $.ajax({
                    url: 'plugins/afterPrint/GetAllClosedZOuts.php',
                    method: 'GET',
                    data: {
                        fromDate: from_date,
                        toDate: to_date
                    },
                    success: function(data) {
                        var zcontrols = JSON.parse(data).results;
                        var len = zcontrols.length;

                        if (!len) {
                            a.processDocuments();
                        }

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
                                    'workstationNo': el.workstation_no,
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
                                    b.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=design_name,eq,' + config_docDesign_ZOUT_v3, {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
                                        processXOutZOut('zout', el.sid, session, 6, format, el, n, ms, ModelService2, b, 'print', path, true).then(() => {
                                            if (i == len) {
                                                a.processDocuments();
                                            }
                                            next(); 
                                        });
                                    });
                                } else {
                                    b.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=design_name,eq,' + config_docDesign_ZOUT_v2, {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(format){
                                        processXOutZOut('zout', el.sid, session, 6, format, el, n, ms, ModelService2, b, 'print', path, true).then(() => {
                                            if (i == len) {
                                                a.processDocuments();
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
    }

    a.processDocuments = function() {
        var from_date = $filter('date')(new Date(a.search.fromDate),'yyyy-MM-dd');
        var to_date = $filter('date')(new Date(a.search.toDate),'yyyy-MM-dd');

        var session = c.get();
        var path = d.path().toString();

        var transformDesignRegular = null;
        var transformDesignReturn = null;

        var config_docDesign_regular_trans = config_docDesign_regular_trans_v2;
        var config_docDesign_return_trans = config_docDesign_return_trans_v2;

        if (config_settingsVersion_receipts == 'v3') {
            config_docDesign_regular_trans = config_docDesign_regular_trans_v3;
            config_docDesign_return_trans = config_docDesign_return_trans_v3;
        }

        b.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_regular_trans + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
            if (transRes.data.length) {
                transformDesignRegular = transRes;
            }


            b.get('/v1/rest/transformdesign?cols=sid,design_name,link&filter=(design_name,eq,' + config_docDesign_return_trans + ')AND(resource_name,eq,DOCUMENT)', {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(transRes){
                if (transRes.data.length) {
                    transformDesignReturn = transRes;
                }

                $.ajax({
                    url: 'plugins/afterPrint/GetAllDocuments.php',
                    method: 'GET',
                    data: {
                        fromDate: from_date,
                        toDate: to_date
                    },
                    success: function(data) {
                        var documents = JSON.parse(data).results;
                        var len = documents.length;

                        if (!len) {
                            a.generateEjournalPerDay();
                        }

                        documents.forEachWithCallback((el, i, next) => {
                            el.store_uid = el.store_sid;
                            el.workstation_uid = el.workstation_uid;
                            el.document_number = el.doc_no;
                            if (el.receipt_type == 0){
                                if (transformDesignRegular) {
                                    var design = transformDesignRegular.data[0];
                                    storeReceipt(el, design, 1, n, b, ms, 'sales', 'regular').then((success) => {
                                        next();
                                    });
                                } else {
                                    next();
                                }
                            } else if (el.receipt_type == 1){
                                if (transformDesignReturn) {
                                    var design = transformDesignReturn.data[0];
                                    storeReceipt(el, design, 2, n, b, ms, 'sales', 'return').then((success) => {
                                        next();
                                    });
                                } else {
                                    next();
                                }
                            } else {
                                next();
                            }

                            if (i == len) {
                                a.generateEjournalPerDay();
                            }
                            
                        });
                    }
                });
            });
        });

    }

    a.generateEjournalPerDay = function() {
        $.ajax({
            url: 'plugins/eJournal/GetEjournalPerDay.php',
            data: { date: 'all' },
            method: 'GET',
            success: function(result) {

                var len = result.length;

                result.forEachWithCallback((el, i, next) => {

                    var len2 = el.length;

                    a.sortable = [];

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
                            var htmldata = n.decode(el2.contain);
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

                                a.sortable.push({content: content, width: parseInt((body1.prevObject[0].style.width).replace("px", ""))});

                            }
                        }

                        if (i2 == len2) {
                            if (storeSid) {
                                ms.get('Store',{sid: storeSid}).then(function(data) {
                                    var params = {
                                        data: a.sortable, 
                                        action: 'exportReceipt',
                                        exportType: 'summary',
                                        date: date,
                                        storeName: data[0].store_name
                                    };

                                    b.post('plugins/eJournal/ejournal.php', params).then(function(result){
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
                        LoadingScreen.Enable = 0;
                    }
                });

            }
        });
    }
}];

window.angular.module('prismPluginsSample.controller.ejournalCtrl', [])
.controller('ejournalCtrl', ejournal);
