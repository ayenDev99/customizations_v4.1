var ejournal = ["$scope", "$http", "prismSessionInfo", "$location", "$modalInstance", "$modal", "XZOutReporter", "$state", "base64","$q","PrintersService","PrismUtilities","ModelService","$filter","$window",
function(a, b, c, d, e, f, k, m, n, o, ps, pu, ms, $filter,$window) {


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

    a.search = function(){

      var from_date = $filter('date')(new Date(a.search.fromDate),'yyyy-MM-dd');
      var dbDate = new Date(a.search.toDate);
      var to_date = $filter('date')(dbDate.setDate(dbDate.getDate()+1),'yyyy-MM-dd');

      var sFilter = "(subsidiary_uid,eq," + c.get().subsidiarysid + ")AND(invoice_posted_date,ge," + from_date + ")";
      sFilter += "AND(invoice_posted_date,le," + to_date + ")AND" + a.search.transList.filter;
        if(a.search.storeList){
          sFilter += "AND(store_uid,eq," + a.search.storeList.sid + ")";
        }
        if(a.search.workstationList){
          sFilter += "AND(workstation_name,eq," + a.search.workstationList.workstation_name + ")";
        }
        sFilter += "AND((sid,eq,458962022000121211) OR (sid,eq,458962155000199216))";
      sFilter += "&sort=document_number,asc";

      var searchFilter = {
        cols:'bt_first_name,bt_last_name,invoice_posted_date,document_number,cashier_login_name,order_qty,return_qty,sid,sold_qty,tender_name,transaction_total_amt,row_version,order_document_number,send_sale_status,order_status,send_sale_fulfillment,item.order_quantity_filled,item.order_type,receipt_type,order_type,store_number,eft_invoice_number',
        filter: sFilter
      };

      ms.get('Document',searchFilter).then(function(res){
//          console.log(res);
        a.documents = res;
      });

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
//        console.log(a.documents);
        a.iframe = document.getElementById('preview_frame');
        iframedoc = a.iframe.contentDocument || a.iframe.contentWindow.document;
        iframedoc.body.innerHTML = "";
        
        a.iframe_ = document.getElementById('test');
        iframedoc_ = a.iframe_.contentDocument || a.iframe_.contentWindow.document;
        iframedoc_.body.innerHTML = "";
        
        
        //--EXPORT
        var recSizeStd = 40;
        z = 0;
        var y = 0;
        var arrData = {};
        
        for (var key in a.documents) {
            if (a.documents.hasOwnProperty(key)) {
                var receipt_type = a.documents[key]['receipt_type'];
                if(a.documents[key]['receipt_type'] == '0' || a.documents[key]['receipt_type'] == '2') {
                    a.processDoc(a.documents[key]['sid'],a.documents[key]['receipt_type'])
                    .then(function(res){
                        htmldata = n.decode(res.data[0].payload);
                        var body = angular.element(htmldata).find('page1');
                        divdata = body.prevObject[2].innerHTML;
                        parsediv = angular.element(divdata).find('div');
    //                    var parsediv = parsediv;

    //                    console.log(parsediv.prevObject.length);
                        for (i = 1; i < parsediv.prevObject.length; i++) {
                            y = parseInt((parsediv.prevObject[i].style.top).replace("px","")); 
                            x = parseInt((parsediv.prevObject[i].style.left).replace("px","")); 

                            arrData[i] = {};
                            arrData[i]['y']= {};
                            arrData[i]['y']= y;
                            arrData[i]['x']= {};
                            arrData[i]['x']= x;
                            arrData[i]['classname']= {};
                            arrData[i]['classname']= parsediv.prevObject[i].className;
                            arrData[i]['data']= {};
                            arrData[i]['data'] = (parsediv.prevObject[i].innerHTML).replace("<b>","").replace("</b>","").replace(/<br\s*[\/]?>/gi, "\n");

                        }

                        var sortable = [];
                        for(var data in arrData){
                            sortable.push(arrData[data]);

                            sortable.sort(function(a, b) {
                                return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
                            });
                        }

                        console.log(receipt_type);

                        z=0;
                        top=0;
    //                    iframedoc_.body.innerHTML += "";
                        iframedoc_.body.innerHTML += "\n";
                        iframedoc_.body.innerHTML += "\n";
                        iframedoc_.body.innerHTML += ' '+a.pads('RPM Technologies Inc.', 40, " ",'STR_PAD_BOTH')+'\n';
                        for (j = 1; j < sortable.length; j++) {
                            v = sortable[j]['x'];
                            u = sortable[j]['y'];
                            class_name = (sortable[j]['classname']).replace("s8",'').replace("s12",'').replace("s11",'').replace("s15",'').replace("s10","").replace(/^\s+|\s+$/gm,"");

                            if(u != z){ 
                                iframedoc_.body.innerHTML += "\n";
                            } 


                            if(v == 27){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n';//
                            } else if(v == 21){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n';//
                            } else if(v == 51){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n';//
                            }else if (v == 42) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n';//
                            }else if (v == 39) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 135) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 136) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 136) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 34) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 35) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 163) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 151) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 212) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 208) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 117) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 162) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 185) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 121) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 132) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 61) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_BOTH')+'\n';//
                            } else if (v == 110) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 17, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 38) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_RIGHT')+'\n';//
                            } else if (v == 106) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 30, " ",'STR_PAD_LEFT')+'\n';//
                            } else if (v == 170) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 18, " ",'STR_PAD_LEFT')+'\n';//
                            } else if (v == 128) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 18, " ",'STR_PAD_LEFT')+'\n';//
                            } else if (v == 139) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 18, " ",'STR_PAD_LEFT')+'\n';//
                            } else if (v == 57) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 28, " ",'STR_PAD_BOTH')+'\n';//
                            } else if (v == 72) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_BOTH')+'\n';//
                            } else if (v == 20) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n';//
                            } else if (v == 19) {
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n';//
                            } else if (v == 0) {
                                iframedoc_.body.innerHTML += ' \n';
                            } else if (v == 23) {
                                iframedoc_.body.innerHTML += ' \n';
                            } else if (v == 31) {
                                iframedoc_.body.innerHTML += ' \n';
                            } 


                            iframedoc_.body.innerHTML += " \n";
                            z = u;

                        }
                        receipt_type = '';
                    });
                } else if(a.documents[key]['receipt_type'] == '1'){
                    
                    a.processDoc(a.documents[key]['sid'],a.documents[key]['receipt_type'])
                    .then(function(res){
                        htmldata = n.decode(res.data[0].payload);
                        var body = angular.element(htmldata).find('page1');
                        divdata = body.prevObject[2].innerHTML;
                        parsediv = angular.element(divdata).find('div');
    //                    var parsediv = parsediv;

    //                    console.log(parsediv.prevObject.length);
                        for (i = 1; i < parsediv.prevObject.length; i++) {
                            y = parseInt((parsediv.prevObject[i].style.top).replace("px","")); 
                            x = parseInt((parsediv.prevObject[i].style.left).replace("px","")); 

                            arrData[i] = {};
                            arrData[i]['y']= {};
                            arrData[i]['y']= y;
                            arrData[i]['x']= {};
                            arrData[i]['x']= x;
                            arrData[i]['classname']= {};
                            arrData[i]['classname']= parsediv.prevObject[i].className;
                            arrData[i]['data']= {};
                            arrData[i]['data'] = (parsediv.prevObject[i].innerHTML).replace("<b>","").replace("</b>","").replace(/<br\s*[\/]?>/gi, "\n");

                        }

                        var sortable = [];
                        for(var data in arrData){
                            sortable.push(arrData[data]);

                            sortable.sort(function(a, b) {
                                return parseInt(a.y) - parseInt(b.y) || parseInt(a.x) - parseInt(b.x);
                            });
                        }

                        console.log(receipt_type);

                        z=0;
                        top=0;
    //                    iframedoc_.body.innerHTML += "";
                        iframedoc_.body.innerHTML += "\n";
                        iframedoc_.body.innerHTML += "\n";
                        iframedoc_.body.innerHTML += ' '+a.pads('RPM Technologies Inc.', 40, " ",'STR_PAD_BOTH')+'\n';
                        for (j = 1; j < sortable.length; j++) {
                            v = sortable[j]['x'];
                            u = sortable[j]['y'];
                            class_name = (sortable[j]['classname']).replace("s8",'').replace("s12",'').replace("s11",'').replace("s15",'').replace("s10","").replace(/^\s+|\s+$/gm,"");

                            if(u != z){ 
                                iframedoc_.body.innerHTML += "\n";
                            } 


                            if(v == 27){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n'; //
                            } else if(v == 19){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n'; //
                            } else if(v == 51){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n'; //
                            } else if(v == 39){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 126){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 38){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 15, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 151){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 13, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 208){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 13, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 106){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 155){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 181){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 113){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 143){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 185){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 8, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 68){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_BOTH')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 114){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 72){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_BOTH')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 177){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 20, " ",'STR_PAD_LEFT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 34){
                                iframedoc_.body.innerHTML += ''+a.pads(sortable[j]['data'], 0, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 133){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 129){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_RIGHT')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
                            } else if(v == 20){
                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 40, " ",'STR_PAD_BOTH')+'\n'; // RIGHT - KANAN SPACE LEFT - KALIWANG SPACE
//                            } else if (v == 34) {
//                                iframedoc_.body.innerHTML += ' '+a.pads(sortable[j]['data'], 10, " ",'STR_PAD_RIGHT');
//                            } else if (v == 35) {
                            } else if (v == 0) {
                                iframedoc_.body.innerHTML += ' \n';
                            } else if (v == 4) {
                                iframedoc_.body.innerHTML += ' \n';
                            } else if (v == 31) {
                                iframedoc_.body.innerHTML += ' \n';
                            } else {
                                iframedoc_.body.innerHTML += ("["+v+"]"+"-["+u+"])"+sortable[j]['data']);
                            }


                            iframedoc_.body.innerHTML += " \n";
                            z = u;

                        }
                        receipt_type = '';
                    });
                }
            }
        }
        
        for (var keys in a.documents) {
          if (a.documents.hasOwnProperty(keys)) {
//            a.processDoc(a.documents[keys]['sid'])
            a.processDoc(a.documents[keys]['sid'],a.documents[keys]['receipt_type'])
            .then(function(res){
                console.log(n.decode(res.data[0].payload));
              iframedoc.body.innerHTML += n.decode(res.data[0].payload);
//              iframedoc_.body.innerHTML += n.decode(res.data[0].payload);
            });
          }
        }
        var xout = '';
        var zout = '';
        xout +='PCFkb2N0eXBlIGh0bWw+PGh0bWw+PGhlYWQ+PHRpdGxlPjwvdGl0bGU+PG1ldGEgaHR0cC1lcXVp';
        xout +='dj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgiPjwvaGVh';
        xout +='ZD48Ym9keT48ZGl2IGlkPSJwYWdlMSIgY2xhc3M9InBhZ2UiIHN0eWxlPSJwb3NpdGlvbjpyZWxh';
        xout +='dGl2ZTt3aWR0aDoyODdweDtoZWlnaHQ6ODc5cHgiPjxkaXYgY2xhc3M9InM4IiBzdHlsZT0idG9w';
        xout +='OjBweDtsZWZ0OjBweDt3aWR0aDoyODdweDtoZWlnaHQ6ODc5cHgiPjwvZGl2PjxkaXYgY2xhc3M9';
        xout +='InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6MTkycHg7bGVmdDo3MHB4O3dpZHRoOjc5cHg7aGVpZ2h0';
        xout +='OjE5cHgiPjA3LzI0LzIwMTc8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTIgczExIiBzdHlsZT0idG9w';
        xout +='OjE5MnB4O2xlZnQ6MTU3cHg7d2lkdGg6NzVweDtoZWlnaHQ6MTlweCI+MTI6MjM6MjkgUE08L2Rp';
        xout +='dj48ZGl2IGNsYXNzPSJzMTMgczEwIHMxMSIgc3R5bGU9InRvcDowcHg7bGVmdDo0NnB4O3dpZHRo';
        xout +='OjIwOHB4O2hlaWdodDoyN3B4Ij5SUE0gVGVjaG5vbG9naWVzIEluYy48L2Rpdj48ZGl2IGNsYXNz';
        xout +='PSJzMTQgczEwIHMxMSIgc3R5bGU9InRvcDoxNjlweDtsZWZ0OjY2cHg7d2lkdGg6MTY2cHg7aGVp';
        xout +='Z2h0OjE5cHgiPiogWC1PdXQgICAgUmVwb3J0ICo8L2Rpdj48ZGl2IGNsYXNzPSJzOCIgc3R5bGU9';
        xout +='InRvcDoyMTVweDtsZWZ0OjQ4cHg7d2lkdGg6MjA4cHg7aGVpZ2h0OjBweCI+PC9kaXY+PGRpdiBj';
        xout +='bGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozNHB4O2xlZnQ6NDVweDt3aWR0aDoyMDhweDto';
        xout +='ZWlnaHQ6MTM5cHgiPk93bmVkIGFuZCBPcGVyYXRlZCBieTogR1RJIDxicj5Db21wYW55IEFkZHJl';
        xout +='c3M6IEFscGhhbGFuZCA8YnI+U291dGhnYXRlIFRvd2VyLCBNYWthdGkgQ2l0eSAxMjMyPGJyPlZB';
        xout +='VC1SRUcgVElOOiAxMjMtNDU2LTc4OS0wMDAwMDxicj5NSU46MDk4LTc2NS00MzIxPGJyPlMvTjog';
        xout +='UE4xMjM0NTY3ODkwPGJyPkFDQ1IuIE5POiAwNDgtMjA4NjUyMDI5LTAwMDIwMzxicj5QVFUuIE5P';
        xout +='LiBGUDEwMjAxNS0wMzgtMDA1OTk2My0wMDAyMzwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEi';
        xout +='IHN0eWxlPSJ0b3A6MjI1cHg7bGVmdDoxMThweDt3aWR0aDoxMjhweDtoZWlnaHQ6MTlweCI+RGVm';
        xout +='YXVsdDI8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMxMSIgc3R5bGU9InRvcDoyMjVweDtsZWZ0';
        xout +='OjUwcHg7d2lkdGg6NjhweDtoZWlnaHQ6MTlweCI+U3RvcmUgTmFtZTo8L2Rpdj48ZGl2IGNsYXNz';
        xout +='PSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjI0NHB4O2xlZnQ6MTE4cHg7d2lkdGg6MTI4cHg7aGVp';
        xout +='Z2h0OjE5cHgiPjI8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMxMSIgc3R5bGU9InRvcDoyNDRw';
        xout +='eDtsZWZ0OjEycHg7d2lkdGg6MTA2cHg7aGVpZ2h0OjE5cHgiPlN0b3JlIE51bWJlcjo8L2Rpdj48';
        xout +='ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjI2M3B4O2xlZnQ6MTE4cHg7d2lkdGg6';
        xout +='MTI4cHg7aGVpZ2h0OjE5cHgiPjAwMjwvZGl2PjxkaXYgY2xhc3M9InMxNSBzMTIgczExIiBzdHls';
        xout +='ZT0idG9wOjI2M3B4O2xlZnQ6NTBweDt3aWR0aDo2OHB4O2hlaWdodDoxOXB4Ij5TdG9yZSBDb2Rl';
        xout +='OjwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6MzAxcHg7bGVmdDoxMThw';
        xout +='eDt3aWR0aDoxMjhweDtoZWlnaHQ6MTlweCI+MDAxPC9kaXY+PGRpdiBjbGFzcz0iczE1IHMxMiBz';
        xout +='MTEiIHN0eWxlPSJ0b3A6MzAxcHg7bGVmdDo1MHB4O3dpZHRoOjY4cHg7aGVpZ2h0OjE5cHgiPlN1';
        xout +='YnNpZGlhcnk6PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozMjBweDts';
        xout +='ZWZ0OjExOHB4O3dpZHRoOjEyOHB4O2hlaWdodDoxOXB4Ij5zeXNkZXYtcm9jZWVfODA4MDwvZGl2';
        xout +='PjxkaXYgY2xhc3M9InMxNSBzMTIgczExIiBzdHlsZT0idG9wOjMyMHB4O2xlZnQ6NTBweDt3aWR0';
        xout +='aDo2OHB4O2hlaWdodDoxOXB4Ij5Xb3Jrc3RhdGlvbjo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAg';
        xout +='czExIiBzdHlsZT0idG9wOjMzOXB4O2xlZnQ6MTE4cHg7d2lkdGg6MTI4cHg7aGVpZ2h0OjE4cHgi';
        xout +='PlJQUzwvZGl2PjxkaXYgY2xhc3M9InMxNSBzMTIgczExIiBzdHlsZT0idG9wOjMzOXB4O2xlZnQ6';
        xout +='MTlweDt3aWR0aDo5OXB4O2hlaWdodDoxOHB4Ij5JbnN0YWxsYXRpb24gSUQ6PC9kaXY+PGRpdiBj';
        xout +='bGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozNTdweDtsZWZ0OjExOHB4O3dpZHRoOjEyOHB4';
        xout +='O2hlaWdodDoxOXB4Ij5BTEw8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMxMSIgc3R5bGU9InRv';
        xout +='cDozNTdweDtsZWZ0OjUwcHg7d2lkdGg6NjhweDtoZWlnaHQ6MTlweCI+Q2FzaGllcihzKTo8L2Rp';
        xout +='dj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjM3NnB4O2xlZnQ6MTE4cHg7d2lk';
        xout +='dGg6MTI4cHg7aGVpZ2h0OjE5cHgiPkFMTDwvZGl2PjxkaXYgY2xhc3M9InMxNSBzMTIgczExIiBz';
        xout +='dHlsZT0idG9wOjM3NnB4O2xlZnQ6NTBweDt3aWR0aDo2OHB4O2hlaWdodDoxOXB4Ij5EcmF3ZXI6';
        xout +='PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozOTVweDtsZWZ0OjExOHB4';
        xout +='O3dpZHRoOjEyOHB4O2hlaWdodDoxOXB4Ij5BTEw8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMx';
        xout +='MSIgc3R5bGU9InRvcDozOTVweDtsZWZ0OjUwcHg7d2lkdGg6NjhweDtoZWlnaHQ6MTlweCI+VGls';
        xout +='bDo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjQxNHB4O2xlZnQ6MTE4';
        xout +='cHg7d2lkdGg6MTI4cHg7aGVpZ2h0OjE5cHgiPjA8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMx';
        xout +='MSIgc3R5bGU9InRvcDo0MTRweDtsZWZ0OjhweDt3aWR0aDoxMTBweDtoZWlnaHQ6MTlweCI+IyBv';
        xout +='ZiBUcmFuczo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjQ0OHB4O2xl';
        xout +='ZnQ6MTEwcHg7d2lkdGg6MTI4cHg7aGVpZ2h0OjE5cHgiPjA3LzI0LzIwMTcgMTI6MDA6MDAgQU08';
        xout +='L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTIgczExIiBzdHlsZT0idG9wOjQzM3B4O2xlZnQ6MTlweDt3';
        xout +='aWR0aDoxMTRweDtoZWlnaHQ6MTlweCI+QmVnaW4gRGF0ZS9UaW1lOjwvZGl2PjxkaXYgY2xhc3M9';
        xout +='InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6NDgycHg7bGVmdDoxMTBweDt3aWR0aDoxMjhweDtoZWln';
        xout +='aHQ6MTlweCI+MDcvMjQvMjAxNyAxMTo1OTo1OSBQTTwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBz';
        xout +='MTEiIHN0eWxlPSJ0b3A6NDYzcHg7bGVmdDozNHB4O3dpZHRoOjk5cHg7aGVpZ2h0OjE5cHgiPkJl';
        xout +='Z2luIERhdGUvVGltZTo8L2Rpdj48ZGl2IGNsYXNzPSJzMTYgczE3IHMxMSIgc3R5bGU9InRvcDo1';
        xout +='MTZweDtsZWZ0OjQycHg7d2lkdGg6MTE3cHg7aGVpZ2h0OjE5cHgiPk5ldCBWYWx1ZXM8L2Rpdj48';
        xout +='ZGl2IGNsYXNzPSJzMTUgczEwIHMxMSIgc3R5bGU9InRvcDo1MzVweDtsZWZ0OjEyMXB4O3dpZHRo';
        xout +='OjY2cHg7aGVpZ2h0OjE5cHgiPlJldHVybnM8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEwIHMxMSIg';
        xout +='c3R5bGU9InRvcDo1MzVweDtsZWZ0OjYxcHg7d2lkdGg6NjZweDtoZWlnaHQ6MTlweCI+U2FsZXM8';
        xout +='L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEwIHMxMSIgc3R5bGU9InRvcDo1MzVweDtsZWZ0OjE4NnB4';
        xout +='O3dpZHRoOjY2cHg7aGVpZ2h0OjE5cHgiPk5ldDwvZGl2PjxkaXYgY2xhc3M9InM4IiBzdHlsZT0i';
        xout +='dG9wOjUzNXB4O2xlZnQ6NHB4O3dpZHRoOjI2MXB4O2hlaWdodDowcHgiPjwvZGl2PjxkaXYgY2xh';
        xout +='c3M9InMxNSBzMTcgczExIiBzdHlsZT0idG9wOjU1NHB4O2xlZnQ6NDJweDt3aWR0aDo0MnB4O2hl';
        xout +='aWdodDoxOXB4Ij5TQUxFUzwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0eWxlPSJ0b3A6';
        xout +='NTY5cHg7bGVmdDo1M3B4O3dpZHRoOjY2cHg7aGVpZ2h0OjE5cHgiPuKCsTAuMDA8L2Rpdj48ZGl2';
        xout +='IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjU2OXB4O2xlZnQ6MTI1cHg7d2lkdGg6NjZw';
        xout +='eDtoZWlnaHQ6MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0eWxl';
        xout +='PSJ0b3A6NTY5cHg7bGVmdDoxODJweDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7igrEwLjAwPC9k';
        xout +='aXY+PGRpdiBjbGFzcz0iczE1IHMxNyBzMTEiIHN0eWxlPSJ0b3A6NTg4cHg7bGVmdDo0NnB4O3dp';
        xout +='ZHRoOjQxcHg7aGVpZ2h0OjE5cHgiPlRBWDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0';
        xout +='eWxlPSJ0b3A6NjAzcHg7bGVmdDo1M3B4O3dpZHRoOjY2cHg7aGVpZ2h0OjE5cHgiPuKCsTAuMDA8';
        xout +='L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjYwM3B4O2xlZnQ6MTI1cHg7';
        xout +='d2lkdGg6NjZweDtoZWlnaHQ6MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBz';
        xout +='MTEiIHN0eWxlPSJ0b3A6NjAzcHg7bGVmdDoxODJweDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7i';
        xout +='grEwLjAwPC9kaXY+PGRpdiBjbGFzcz0iczE1IHMxMiBzMTEiIHN0eWxlPSJ0b3A6NjIycHg7bGVm';
        xout +='dDo0NnB4O3dpZHRoOjU2cHg7aGVpZ2h0OjE5cHgiPlNISVBQSU5HPC9kaXY+PGRpdiBjbGFzcz0i';
        xout +='czkgczEyIHMxMSIgc3R5bGU9InRvcDo2NDFweDtsZWZ0OjUwcHg7d2lkdGg6NjZweDtoZWlnaHQ6';
        xout +='MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6NjQx';
        xout +='cHg7bGVmdDoxMjFweDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7igrEwLjAwPC9kaXY+PGRpdiBj';
        xout +='bGFzcz0iczkgczEyIHMxMSIgc3R5bGU9InRvcDo2NDFweDtsZWZ0OjE4MnB4O3dpZHRoOjY2cHg7';
        xout +='aGVpZ2h0OjE5cHgiPuKCsTAuMDA8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczE3IHMxMSIgc3R5bGU9';
        xout +='InRvcDo2NjBweDtsZWZ0OjQ2cHg7d2lkdGg6NDFweDtoZWlnaHQ6MTlweCI+RkVFPC9kaXY+PGRp';
        xout +='diBjbGFzcz0iczkgczEyIHMxMSIgc3R5bGU9InRvcDo2NzlweDtsZWZ0OjUwcHg7d2lkdGg6NjZw';
        xout +='eDtoZWlnaHQ6MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxl';
        xout +='PSJ0b3A6Njc5cHg7bGVmdDoxMjFweDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7igrEwLjAwPC9k';
        xout +='aXY+PGRpdiBjbGFzcz0iczkgczEyIHMxMSIgc3R5bGU9InRvcDo2NzlweDtsZWZ0OjE4MnB4O3dp';
        xout +='ZHRoOjY2cHg7aGVpZ2h0OjE5cHgiPuKCsTAuMDA8L2Rpdj48ZGl2IGNsYXNzPSJzMTUgczEyIHMx';
        xout +='MSIgc3R5bGU9InRvcDo2OThweDtsZWZ0OjQycHg7d2lkdGg6NDJweDtoZWlnaHQ6MTlweCI+U09E';
        xout +='RVA8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTIgczExIiBzdHlsZT0idG9wOjcxM3B4O2xlZnQ6NTBw';
        xout +='eDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7igrEwLjAwPC9kaXY+PGRpdiBjbGFzcz0iczkgczEw';
        xout +='IHMxMSIgc3R5bGU9InRvcDo3MTNweDtsZWZ0OjEyMXB4O3dpZHRoOjY2cHg7aGVpZ2h0OjE5cHgi';
        xout +='PuKCsTAuMDA8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTIgczExIiBzdHlsZT0idG9wOjcxM3B4O2xl';
        xout +='ZnQ6MTgycHg7d2lkdGg6NjZweDtoZWlnaHQ6MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9';
        xout +='InMxNSBzMTIgczExIiBzdHlsZT0idG9wOjczMnB4O2xlZnQ6NDJweDt3aWR0aDo0MnB4O2hlaWdo';
        xout +='dDoxOXB4Ij5UT1RBTDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0eWxlPSJ0b3A6NzQ3';
        xout +='cHg7bGVmdDo1MHB4O3dpZHRoOjY2cHg7aGVpZ2h0OjE5cHgiPuKCsTAuMDA8L2Rpdj48ZGl2IGNs';
        xout +='YXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjc0N3B4O2xlZnQ6MTIxcHg7d2lkdGg6NjZweDto';
        xout +='ZWlnaHQ6MTlweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0eWxlPSJ0';
        xout +='b3A6NzQ3cHg7bGVmdDoxODJweDt3aWR0aDo2NnB4O2hlaWdodDoxOXB4Ij7igrEwLjAwPC9kaXY+';
        xout +='PGRpdiBjbGFzcz0iczE2IHMxNyBzMTEiIHN0eWxlPSJ0b3A6Nzc3cHg7bGVmdDo0MnB4O3dpZHRo';
        xout +='OjExN3B4O2hlaWdodDoxOXB4Ij5NaW51czwvZGl2PjxkaXYgY2xhc3M9InM4IiBzdHlsZT0idG9w';
        xout +='Ojc5NnB4O2xlZnQ6MHB4O3dpZHRoOjI2MXB4O2hlaWdodDowcHgiPjwvZGl2PjxkaXYgY2xhc3M9';
        xout +='InMxNSBzMTcgczExIiBzdHlsZT0idG9wOjgwN3B4O2xlZnQ6NDZweDt3aWR0aDoxMTdweDtoZWln';
        xout +='aHQ6MTVweCI+Q2FzaCBGbG93IFRvdGFsOjwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0';
        xout +='eWxlPSJ0b3A6ODA3cHg7bGVmdDoxMjFweDt3aWR0aDoxMTdweDtoZWlnaHQ6MTVweCI+4oKxMC4w';
        xout +='MDwvZGl2PjxkaXYgY2xhc3M9InMxNiBzMTcgczExIiBzdHlsZT0idG9wOjgzNHB4O2xlZnQ6NDZw';
        xout +='eDt3aWR0aDoxMTdweDtoZWlnaHQ6MTlweCI+UmVjZWlwdCBDb3VudHM8L2Rpdj48ZGl2IGNsYXNz';
        xout +='PSJzOCBzMTIgczExIiBzdHlsZT0idG9wOjg1NnB4O2xlZnQ6NjQzcHg7d2lkdGg6NzVweDtoZWln';
        xout +='aHQ6MTlweCI+MTwvZGl2PjwvZGl2PjxzdHlsZT5kaXYsIGltZywgdGFibGV7cG9zaXRpb246YWJz';
        xout +='b2x1dGV9ZGl2LCB0ZHtvdmVyZmxvdzpoaWRkZW59dHIsIHRkLCB0YWJsZSwgdGJvZHl7dGV4dC1k';
        xout +='ZWNvcmF0aW9uOmluaGVyaXQ7dmVydGljYWwtYWxpZ246aW5oZXJpdH10YWJsZXt3aWR0aDoxMDAl';
        xout +='O2hlaWdodDoxMDAlO2JvcmRlci1zcGFjaW5nOjB9aW1ne3otaW5kZXg6MX0ubmF2e2ZvbnQ6Ym9s';
        xout +='ZCAxMnB4IENhbGlicmk7bWFyZ2luOjFlbX0ubmF2IGF7dGV4dC1kZWNvcmF0aW9uOm5vbmU7bWFy';
        xout +='Z2luLXJpZ2h0OjFlbTtjb2xvcjpibGFja30ubmF2IGE6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVu';
        xout +='ZGVybGluZX0uczh7Y29sb3I6YmxhY2s7Zm9udDoxMHB0IEFyaWFsfS5zOXtjb2xvcjpibGFjaztm';
        xout +='b250OjhwdCBBcmlhbH0uczEwe3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0u';
        xout +='czExe30uczEye3RleHQtYWxpZ246cmlnaHQ7dmVydGljYWwtYWxpZ246dG9wfS5zMTN7Y29sb3I6';
        xout +='YmxhY2s7Zm9udDpib2xkIDEycHQgQXJpYWx9LnMxNHtjb2xvcjpibGFjaztmb250OjlwdCBBcmlh';
        xout +='bH0uczE1e2NvbG9yOmJsYWNrO2ZvbnQ6Ym9sZCA4cHQgQXJpYWx9LnMxNntjb2xvcjpibGFjaztm';
        xout +='b250OmJvbGQgMTBwdCBBcmlhbH0uczE3e3ZlcnRpY2FsLWFsaWduOnRvcH08L3N0eWxlPjwvYm9k';
        xout +='eT48L2h0bWw+';

        
        iframedoc.body.innerHTML += n.decode(xout);
        
        zout +=' PCFkb2N0eXBlIGh0bWw+PGh0bWw+PGhlYWQ+PHRpdGxlPjwvdGl0bGU+PG1ldGEgaHR0cC1lcXVp';
        zout +=' dj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgiPjwvaGVh';
        zout +=' ZD48Ym9keT48ZGl2IGlkPSJwYWdlMSIgY2xhc3M9InBhZ2UiIHN0eWxlPSJwb3NpdGlvbjpyZWxh';
        zout +=' dGl2ZTt3aWR0aDoyOTlweDtoZWlnaHQ6MTI4NXB4Ij48ZGl2IGNsYXNzPSJzOCIgc3R5bGU9InRv';
        zout +=' cDoxOXB4O2xlZnQ6MTlweDt3aWR0aDoyNjFweDtoZWlnaHQ6MTI0N3B4Ij48L2Rpdj48ZGl2IGNs';
        zout +=' YXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjE5cHg7bGVmdDoxOXB4O3dpZHRoOjc5cHg7aGVp';
        zout +=' Z2h0OjI2cHgiPlogT3V0IFJlcG9ydDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMiBzMTEiIHN0eWxl';
        zout +=' PSJ0b3A6MTlweDtsZWZ0Ojk5cHg7d2lkdGg6NzlweDtoZWlnaHQ6MjZweCI+MDcvMjYvMjAxNzwv';
        zout +=' ZGl2PjxkaXYgY2xhc3M9InM5IHMxMyBzMTEiIHN0eWxlPSJ0b3A6MTlweDtsZWZ0OjE5M3B4O3dp';
        zout +=' ZHRoOjc2cHg7aGVpZ2h0OjI2cHgiPjA1OjM2OjE2IFBNPC9kaXY+PGRpdiBjbGFzcz0iczE0IHMx';
        zout +=' MCBzMTEiIHN0eWxlPSJ0b3A6MjM2cHg7bGVmdDo2N3B4O3dpZHRoOjc5cHg7aGVpZ2h0OjI3cHgi';
        zout +=' PjA3LzI2LzIwMTc8L2Rpdj48ZGl2IGNsYXNzPSJzMTQgczEzIHMxMSIgc3R5bGU9InRvcDoyMzZw';
        zout +=' eDtsZWZ0OjE1N3B4O3dpZHRoOjc2cHg7aGVpZ2h0OjI3cHgiPjA1OjM2OjE2IFBNPC9kaXY+PGRp';
        zout +=' diBjbGFzcz0iczE1IHMxMiBzMTEiIHN0eWxlPSJ0b3A6MzhweDtsZWZ0OjQ2cHg7d2lkdGg6MjA4';
        zout +=' cHg7aGVpZ2h0OjI2cHgiPlJQTSBUZWNobm9sb2dpZXMgSW5jLjwvZGl2PjxkaXYgY2xhc3M9InMx';
        zout +=' NiBzMTIgczExIiBzdHlsZT0idG9wOjIxNHB4O2xlZnQ6NjdweDt3aWR0aDoxNjZweDtoZWlnaHQ6';
        zout +=' MThweCI+KiBaLU91dCAgICBSZWFkaW5nICo8L2Rpdj48ZGl2IGNsYXNzPSJzMTQgczEyIHMxMSIg';
        zout +=' c3R5bGU9InRvcDo2NnB4O2xlZnQ6NDVweDt3aWR0aDoyMDhweDtoZWlnaHQ6MTEzcHgiPk93bmVk';
        zout +=' IGFuZCBPcGVyYXRlZCBieTogR1RJIDxicj5Db21wYW55IEFkZHJlc3M6IEFscGhhbGFuZCA8YnI+';
        zout +=' U291dGhnYXRlIFRvd2VyLCBNYWthdGkgQ2l0eSAxMjMyPGJyPlZBVC1SRUcgVElOOiAxMjMtNDU2';
        zout +=' LTc4OS0wMDAwMDxicj5NSU46MDk4LTc2NS00MzIxPGJyPlMvTjogUE4xMjM0NTY3ODkwPGJyPkFD';
        zout +=' Q1IuIE5POiAwNDgtMjA4NjUyMDI5LTAwMDIwMzxicj5QVFUuIE5PLiBGUDEwMjAxNS0wMzgtMDA1';
        zout +=' OTk2My0wMDAyMzwvZGl2PjxkaXYgY2xhc3M9InMxNyBzMTAgczExIiBzdHlsZT0idG9wOjE3MjZw';
        zout +=' eDtsZWZ0OjM1cHg7d2lkdGg6OThweDtoZWlnaHQ6MTlweCI+UGF5bWVudCBNb2RlPC9kaXY+PGRp';
        zout +=' diBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDoyNzZweDtsZWZ0OjExNHB4O3dpZHRoOjE1';
        zout +=' NXB4O2hlaWdodDoxOXB4Ij5EZWZhdWx0MjwvZGl2PjxkaXYgY2xhc3M9InMxNyBzMTMgczExIiBz';
        zout +=' dHlsZT0idG9wOjI3NnB4O2xlZnQ6MzFweDt3aWR0aDo4M3B4O2hlaWdodDoxOXB4Ij5TdG9yZSBO';
        zout +=' YW1lOjwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6Mjk1cHg7bGVmdDox';
        zout +=' MTRweDt3aWR0aDoxNTVweDtoZWlnaHQ6MTlweCI+MDAyPC9kaXY+PGRpdiBjbGFzcz0iczE3IHMx';
        zout +=' MyBzMTEiIHN0eWxlPSJ0b3A6Mjk1cHg7bGVmdDozMXB4O3dpZHRoOjgzcHg7aGVpZ2h0OjE5cHgi';
        zout +=' PlN0b3JlIENvZGU6PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozMTNw';
        zout +=' eDtsZWZ0OjExNHB4O3dpZHRoOjE1NXB4O2hlaWdodDoxOXB4Ij4wMDE8L2Rpdj48ZGl2IGNsYXNz';
        zout +=' PSJzMTcgczEzIHMxMSIgc3R5bGU9InRvcDozMTNweDtsZWZ0OjMxcHg7d2lkdGg6ODNweDtoZWln';
        zout +=' aHQ6MTlweCI+U3Vic2lkaWFyeTo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0i';
        zout +=' dG9wOjMzMnB4O2xlZnQ6MTE0cHg7d2lkdGg6MTU1cHg7aGVpZ2h0OjE5cHgiPkFMTDwvZGl2Pjxk';
        zout +=' aXYgY2xhc3M9InMxNyBzMTMgczExIiBzdHlsZT0idG9wOjMzMnB4O2xlZnQ6MzFweDt3aWR0aDo4';
        zout +=' M3B4O2hlaWdodDoxOXB4Ij5Xb3Jrc3RhdGlvbjo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczEx';
        zout +=' IiBzdHlsZT0idG9wOjM1MXB4O2xlZnQ6MTE0cHg7d2lkdGg6MTU1cHg7aGVpZ2h0OjE5cHgiPlJv';
        zout +=' Y2VlIExsb3NhPC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMyBzMTEiIHN0eWxlPSJ0b3A6MzUxcHg7';
        zout +=' bGVmdDozMXB4O3dpZHRoOjgzcHg7aGVpZ2h0OjE5cHgiPkNhc2hpZXIocyk6PC9kaXY+PGRpdiBj';
        zout +=' bGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDozNzBweDtsZWZ0OjExNHB4O3dpZHRoOjE1NXB4';
        zout +=' O2hlaWdodDoxOXB4Ij4xPC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMyBzMTEiIHN0eWxlPSJ0b3A6';
        zout +=' MzcwcHg7bGVmdDozMXB4O3dpZHRoOjgzcHg7aGVpZ2h0OjE5cHgiPkRyYXdlcjo8L2Rpdj48ZGl2';
        zout +=' IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjM4OXB4O2xlZnQ6MTE0cHg7d2lkdGg6MTU1';
        zout +=' cHg7aGVpZ2h0OjE5cHgiPkFMTDwvZGl2PjxkaXYgY2xhc3M9InMxNyBzMTMgczExIiBzdHlsZT0i';
        zout +=' dG9wOjM4OXB4O2xlZnQ6MzFweDt3aWR0aDo4M3B4O2hlaWdodDoxOXB4Ij5UaWxsOjwvZGl2Pjxk';
        zout +=' aXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6NDA4cHg7bGVmdDoxMTRweDt3aWR0aDox';
        zout +=' NTVweDtoZWlnaHQ6MTlweCI+MTk8L2Rpdj48ZGl2IGNsYXNzPSJzMTcgczEzIHMxMSIgc3R5bGU9';
        zout +=' InRvcDo0MDhweDtsZWZ0OjMxcHg7d2lkdGg6ODNweDtoZWlnaHQ6MTlweCI+IyBvZiBUcmFuc2Fj';
        zout +=' dGlvbnM6PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDo0MjdweDtsZWZ0';
        zout +=' OjExNHB4O3dpZHRoOjE1NXB4O2hlaWdodDoxOXB4Ij4wNy8yNC8yMDE3IDA0OjAxOjUzIFBNPC9k';
        zout +=' aXY+PGRpdiBjbGFzcz0iczE3IHMxMyBzMTEiIHN0eWxlPSJ0b3A6NDI3cHg7bGVmdDozMXB4O3dp';
        zout +=' ZHRoOjgzcHg7aGVpZ2h0OjE5cHgiPk9wZW4gRGF0ZS9UaW1lOjwvZGl2PjxkaXYgY2xhc3M9InM5';
        zout +=' IHMxMCBzMTEiIHN0eWxlPSJ0b3A6NDQ2cHg7bGVmdDoxMTRweDt3aWR0aDoxNTVweDtoZWlnaHQ6';
        zout +=' MTlweCI+MDcvMjYvMjAxNyAwNTozNjoxNiBQTTwvZGl2PjxkaXYgY2xhc3M9InMxNyBzMTMgczEx';
        zout +=' IiBzdHlsZT0idG9wOjQ0NnB4O2xlZnQ6MzFweDt3aWR0aDo4M3B4O2hlaWdodDoxOXB4Ij5DbG9z';
        zout +=' ZSBEYXRlL1RpbWU6PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIiBzdHlsZT0idG9wOjQ2NXB4O2xl';
        zout +=' ZnQ6MTE0cHg7d2lkdGg6MTU1cHg7aGVpZ2h0OjE4cHgiPjwvZGl2PjxkaXYgY2xhc3M9InMxNyBz';
        zout +=' MTMgczExIiBzdHlsZT0idG9wOjQ2NXB4O2xlZnQ6MzFweDt3aWR0aDo4M3B4O2hlaWdodDoxOHB4';
        zout +=' Ij5DbG9zZWQgQnk6PC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMCBzMTEiIHN0eWxlPSJ0b3A6NTEw';
        zout +=' cHg7bGVmdDozNnB4O3dpZHRoOjk4cHg7aGVpZ2h0OjE5cHgiPk5ldCBWYWx1ZXM8L2Rpdj48ZGl2';
        zout +=' IGNsYXNzPSJzMTcgczEwIHMxMSIgc3R5bGU9InRvcDo1MjlweDtsZWZ0OjEzOXB4O3dpZHRoOjY4';
        zout +=' cHg7aGVpZ2h0OjE5cHgiPlJldHVybnM8L2Rpdj48ZGl2IGNsYXNzPSJzMTcgczEwIHMxMSIgc3R5';
        zout +=' bGU9InRvcDo1MjlweDtsZWZ0Ojc1cHg7d2lkdGg6NjRweDtoZWlnaHQ6MTlweCI+U2FsZXM8L2Rp';
        zout +=' dj48ZGl2…Hg7aGVpZ2h0OjMwcHgiPuKCsTAuMDA8L2Rpdj48';
        zout +=' ZGl2IGNsYXNzPSJzOSBzMTMgczExIiBzdHlsZT0idG9wOjg5MnB4O2xlZnQ6MTUycHg7d2lkdGg6';
        zout +=' NTBweDtoZWlnaHQ6MzBweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMyBzMTEiIHN0';
        zout +=' eWxlPSJ0b3A6ODkycHg7bGVmdDoxOTZweDt3aWR0aDo0OXB4O2hlaWdodDozMHB4Ij7igrEwLjAw';
        zout +=' PC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMCBzMTEiIHN0eWxlPSJ0b3A6OTQ1cHg7bGVmdDozNXB4';
        zout +=' O3dpZHRoOjY0cHg7aGVpZ2h0OjE5cHgiPkZlZSBOYW1lPC9kaXY+PGRpdiBjbGFzcz0iczE3IHMx';
        zout +=' MyBzMTEiIHN0eWxlPSJ0b3A6OTQ1cHg7bGVmdDoxMDBweDt3aWR0aDo1N3B4O2hlaWdodDoxOXB4';
        zout +=' Ij5QQUlEIE9VVDwvZGl2PjxkaXYgY2xhc3M9InMxNyBzMTMgczExIiBzdHlsZT0idG9wOjk0NXB4';
        zout +=' O2xlZnQ6MTUycHg7d2lkdGg6NTBweDtoZWlnaHQ6MTlweCI+UEFJRCBJTjwvZGl2PjxkaXYgY2xh';
        zout +=' c3M9InMxNyBzMTMgczExIiBzdHlsZT0idG9wOjk0NXB4O2xlZnQ6MTk2cHg7d2lkdGg6NDZweDto';
        zout +=' ZWlnaHQ6MTlweCI+TkVUPC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMCBzMTEiIHN0eWxlPSJ0b3A6';
        zout +=' OTI1cHg7bGVmdDozNXB4O3dpZHRoOjg3cHg7aGVpZ2h0OjE5cHgiPkZlZXM8L2Rpdj48ZGl2IGNs';
        zout +=' YXNzPSJzOSIgc3R5bGU9InRvcDo5NDRweDtsZWZ0OjE5cHg7d2lkdGg6MjYxcHg7aGVpZ2h0OjBw';
        zout +=' eCI+PC9kaXY+PGRpdiBjbGFzcz0iczE3IHMxMCBzMTEiIHN0eWxlPSJ0b3A6OTY0cHg7bGVmdDoz';
        zout +=' NXB4O3dpZHRoOjY0cHg7aGVpZ2h0OjMwcHgiPkZFRSBUT1RBTDwvZGl2PjxkaXYgY2xhc3M9InM5';
        zout +=' IHMxMyBzMTEiIHN0eWxlPSJ0b3A6OTY0cHg7bGVmdDoxMDBweDt3aWR0aDo0OXB4O2hlaWdodDoz';
        zout +=' MHB4Ij7igrEwLjAwPC9kaXY+PGRpdiBjbGFzcz0iczkgczEzIHMxMSIgc3R5bGU9InRvcDo5NjRw';
        zout +=' eDtsZWZ0OjE1MnB4O3dpZHRoOjUwcHg7aGVpZ2h0OjMwcHgiPuKCsTAuMDA8L2Rpdj48ZGl2IGNs';
        zout +=' YXNzPSJzOSBzMTMgczExIiBzdHlsZT0idG9wOjk2NHB4O2xlZnQ6MTk2cHg7d2lkdGg6NDlweDto';
        zout +=' ZWlnaHQ6MzBweCI+4oKxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IiBzdHlsZT0idG9wOjEwMjBw';
        zout +=' eDtsZWZ0OjE5cHg7d2lkdGg6MjYxcHg7aGVpZ2h0OjBweCI+PC9kaXY+PGRpdiBjbGFzcz0iczE3';
        zout +=' IHMxMCBzMTEiIHN0eWxlPSJ0b3A6MTAyMHB4O2xlZnQ6NDVweDt3aWR0aDoyMTZweDtoZWlnaHQ6';
        zout +=' MTlweCI+RE9MTEFSUzwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6MTAz';
        zout +=' OXB4O2xlZnQ6MTQzcHg7d2lkdGg6MTA2cHg7aGVpZ2h0OjE5cHgiPiQxMywwMDAuMDA8L2Rpdj48';
        zout +=' ZGl2IGNsYXNzPSJzOSBzMTMgczExIiBzdHlsZT0idG9wOjEwMzlweDtsZWZ0OjQ1cHg7d2lkdGg6';
        zout +=' OTVweDtoZWlnaHQ6MTlweCI+UEFJRCBJTjo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBz';
        zout +=' dHlsZT0idG9wOjEwNThweDtsZWZ0OjE0M3B4O3dpZHRoOjEwNnB4O2hlaWdodDoxOXB4Ij4kNiww';
        zout +=' MDAuMDA8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTMgczExIiBzdHlsZT0idG9wOjEwNThweDtsZWZ0';
        zout +=' OjQ1cHg7d2lkdGg6OTVweDtoZWlnaHQ6MTlweCI+UEFJRCBPVVQ6PC9kaXY+PGRpdiBjbGFzcz0i';
        zout +=' czkgczEwIHMxMSIgc3R5bGU9InRvcDoxMDc3cHg7bGVmdDoxNDNweDt3aWR0aDoxMDZweDtoZWln';
        zout +=' aHQ6MTlweCI+JDEwLjAwPC9kaXY+PGRpdiBjbGFzcz0iczkgczEzIHMxMSIgc3R5bGU9InRvcDox';
        zout +=' MDc3cHg7bGVmdDo0NXB4O3dpZHRoOjk1cHg7aGVpZ2h0OjE5cHgiPkJFR0lOOjwvZGl2PjxkaXYg';
        zout +=' Y2xhc3M9InM5IHMxMCBzMTEiIHN0eWxlPSJ0b3A6MTA5NnB4O2xlZnQ6MTQzcHg7d2lkdGg6MTA2';
        zout +=' cHg7aGVpZ2h0OjE5cHgiPiQ3LDAxMC4wMDwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMyBzMTEiIHN0';
        zout +=' eWxlPSJ0b3A6MTA5NnB4O2xlZnQ6NDVweDt3aWR0aDo5NXB4O2hlaWdodDoxOXB4Ij5ORVQ6PC9k';
        zout +=' aXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDoxMTE1cHg7bGVmdDoxNDNweDt3';
        zout +=' aWR0aDoxMDZweDtoZWlnaHQ6MTlweCI+JDAuMDA8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTMgczEx';
        zout +=' IiBzdHlsZT0idG9wOjExMTVweDtsZWZ0OjQ1cHg7d2lkdGg6OTVweDtoZWlnaHQ6MTlweCI+Q09V';
        zout +=' TlQ6PC9kaXY+PGRpdiBjbGFzcz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDoxMTM0cHg7bGVmdDox';
        zout +=' NDNweDt3aWR0aDoxMDZweDtoZWlnaHQ6MTlweCI+KCQ3LDAxMC4wMCk8L2Rpdj48ZGl2IGNsYXNz';
        zout +=' PSJzOSBzMTMgczExIiBzdHlsZT0idG9wOjExMzRweDtsZWZ0OjQ1cHg7d2lkdGg6OTVweDtoZWln';
        zout +=' aHQ6MTlweCI+T1ZFUjo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0idG9wOjEx';
        zout +=' NTNweDtsZWZ0OjE0M3B4O3dpZHRoOjEwNnB4O2hlaWdodDoxOXB4Ij4kMC4wMDwvZGl2PjxkaXYg';
        zout +=' Y2xhc3M9InM5IHMxMyBzMTEiIHN0eWxlPSJ0b3A6MTE1M3B4O2xlZnQ6NDVweDt3aWR0aDo5NXB4';
        zout +=' O2hlaWdodDoxOXB4Ij5MRUFWRTo8L2Rpdj48ZGl2IGNsYXNzPSJzOSBzMTAgczExIiBzdHlsZT0i';
        zout +=' dG9wOjExNzJweDtsZWZ0OjE0M3B4O3dpZHRoOjEwNnB4O2hlaWdodDoxOXB4Ij4kMC4wMDwvZGl2';
        zout +=' PjxkaXYgY2xhc3M9InM5IHMxMyBzMTEiIHN0eWxlPSJ0b3A6MTE3MnB4O2xlZnQ6NDVweDt3aWR0';
        zout +=' aDo5NXB4O2hlaWdodDoxOXB4Ij5ERVBPU0lUOjwvZGl2PjxkaXYgY2xhc3M9InM5IHMxMCBzMTEi';
        zout +=' IHN0eWxlPSJ0b3A6MTE5N3B4O2xlZnQ6NDZweDt3aWR0aDoyMDRweDtoZWlnaHQ6MTVweCI+T2xk';
        zout +=' IEFjY3VtdWxhdGVkIEdyYW5kIFRvdGFsIFNhbGVzOuKCsTEsMDAwLjAwPC9kaXY+PGRpdiBjbGFz';
        zout +=' cz0iczkgczEwIHMxMSIgc3R5bGU9InRvcDoxMjE4cHg7bGVmdDo0NnB4O3dpZHRoOjIwNHB4O2hl';
        zout +=' aWdodDoxNXB4Ij5OZXcgQWNjdW11bGF0ZWQgR3JhbmQgVG90YWwgU2FsZXNsOuKCsTgsMDAwLjAw';
        zout +=' PC9kaXY+PC9kaXY+PHN0eWxlPmRpdiwgaW1nLCB0YWJsZXtwb3NpdGlvbjphYnNvbHV0ZX1kaXYs';
        zout +=' IHRke292ZXJmbG93OmhpZGRlbn10ciwgdGQsIHRhYmxlLCB0Ym9keXt0ZXh0LWRlY29yYXRpb246';
        zout +=' aW5oZXJpdDt2ZXJ0aWNhbC1hbGlnbjppbmhlcml0fXRhYmxle3dpZHRoOjEwMCU7aGVpZ2h0OjEw';
        zout +=' MCU7Ym9yZGVyLXNwYWNpbmc6MH1pbWd7ei1pbmRleDoxfS5uYXZ7Zm9udDpib2xkIDEycHggQ2Fs';
        zout +=' aWJyaTttYXJnaW46MWVtfS5uYXYgYXt0ZXh0LWRlY29yYXRpb246bm9uZTttYXJnaW4tcmlnaHQ6';
        zout +=' MWVtO2NvbG9yOmJsYWNrfS5uYXYgYTpob3Zlcnt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5z';
        zout +=' OHtjb2xvcjpibGFjaztmb250OjEwcHQgQXJpYWx9LnM5e2NvbG9yOmJsYWNrO2ZvbnQ6N3B0IEFy';
        zout +=' aWFsfS5zMTB7dmVydGljYWwtYWxpZ246dG9wfS5zMTF7fS5zMTJ7dGV4dC1hbGlnbjpjZW50ZXI7';
        zout +=' dmVydGljYWwtYWxpZ246dG9wfS5zMTN7dGV4dC1hbGlnbjpyaWdodDt2ZXJ0aWNhbC1hbGlnbjp0';
        zout +=' b3B9LnMxNHtjb2xvcjpibGFjaztmb250OjhwdCBBcmlhbH0uczE1e2NvbG9yOmJsYWNrO2ZvbnQ6';
        zout +=' Ym9sZCAxMnB0IEFyaWFsfS5zMTZ7Y29sb3I6YmxhY2s7Zm9udDo5cHQgQXJpYWx9LnMxN3tjb2xv';
        zout +=' cjpibGFjaztmb250OmJvbGQgN3B0IEFyaWFsfS5zMTh7Y29sb3I6YmxhY2s7Zm9udDpib2xkIDEw';
        zout +=' cHQgQXJpYWx9PC9zdHlsZT48L2JvZHk+PC9odG1sPg==';

        iframedoc.body.innerHTML += n.decode(zout);

    }
    
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
        
        a.iframe = document.getElementById('test'),
        iframedoc = a.iframe.contentDocument || a.iframe.contentWindow.document;
        var elHtml = iframedoc.body.innerHTML;
        var link = document.createElement('a');
        var mimeType = 'text/plain';
 
        link.setAttribute('download', 'BIR-EJOURNAL-SUMMARY');
        link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
        link.click();
        
        
    }


}];

window.angular.module('prismPluginsSample.controller.ejournalCtrl', [])
   .controller('ejournalCtrl', ejournal);
