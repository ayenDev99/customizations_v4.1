var specialDiscountModalCtrl = ["ResourceNotificationService", "$scope", "$http", "ModelService", "ModelService2", "$stateParams", "prismSessionInfo", "$location", "$uibModalInstance", "$uibModal", "XZOutReporter", "$state", "base64","$q","PrintersService","PrismUtilities","$filter","$window", "ResourceNotificationService", "LoadingScreen", "NotificationService",
function(ResourceNotificationService, $scope, $http, ModelService, ModelService2, $stateParams, prismSessionInfo, $location, $uibModalInstance, $uibModal, XZOutReporter, $state, base64, $q, PrintersService, PrismUtilities, $filter, $window, RN, LoadingScreen, NotificationService) {
    'use strict';
    var sess = $http.defaults.headers.common['Auth-Session'];
    var servername = $window.location.origin;

    sessionStorage.removeItem('discountType');
    sessionStorage.removeItem('discountPerc');
    sessionStorage.removeItem('discountLimit');
    sessionStorage.removeItem('guestCount');
    sessionStorage.removeItem('guestCountSCPWD');
    sessionStorage.removeItem('SCPWDGuests');
    sessionStorage.removeItem('guestNames');
    sessionStorage.removeItem('guestTins');
    sessionStorage.removeItem('guestIds');

    $scope.isSCSpecialDiscountEnabled = false;
    $scope.isPWDSpecialDiscountEnabled = false;
    $scope.isAthleteSpecialDiscountEnabled = false;
    $scope.isSoloParentSpecialDiscountEnabled = false;

    $scope.isEMPSpecialDiscountEnabled = false;
    $scope.isMASpecialDiscountEnabled = true;
    $scope.isBARFREESpecialDiscountEnabled = false;
    $scope.isDRCOUPSpecialDiscountEnabled = false;
    $scope.isPERCARDSpecialDiscountEnabled = false;
    $scope.isMARKFOCSpecialDiscountEnabled = true;
    $scope.isEXECFOCSpecialDiscountEnabled = false;

    $scope.SCCustUDF = config_special_discount_sc_cust_udf;
    $scope.PWDCustUDF = config_special_discount_pwd_cust_udf;
    $scope.athleteCustUDF = config_special_discount_athlete_cust_udf;
    $scope.soloParentCustUDF = config_special_discount_solo_parent_cust_udf;

    $scope.config_special_discount_process_type = config_special_discount_process_type;
    $scope.config_special_discount_restaurant_max_cust = config_special_discount_restaurant_max_cust;

    ModelService.get('Document', {sid: $stateParams.document_sid}).then((docs) => {
        var doc = docs[0];

        if (doc.bt_cuid) {

            $scope.isEMPSpecialDiscountEnabled = true;
            $scope.isBARFREESpecialDiscountEnabled = true;
            $scope.isEXECFOCSpecialDiscountEnabled = true;

            ModelService2.get('Customer', {sid: doc.bt_cuid, cols: "*,custextend.*"}).then((custs) => {
                var cust = custs[0];

                if (config_special_discount_process_type == 'default') {
                    // if (!cust.detax) {
                        ModelService.get('Item', {document_sid: $stateParams.document_sid, cols: '*'}).then((items) => {
                            console.log(items);

                            for (var i = 0; i < items.length; i++) {

                                ModelService.get('Inventory', {sid: items[i].invn_sbs_item_sid}).then((invns) => {

                                    var invn = invns[0]; 

                                    var codes = 'NAC,NACSP,SCPWDNAC,ALL';
                                    codes = codes.split(',');

                                    for (var x = 0; x < codes.length; x++) {
                                        if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                            $scope.isAthleteSpecialDiscountEnabled = true;
                                        }
                                    }

                                    if ((invn.udf1_string).toLowerCase() == 'coffee' || (invn.udf1_string).toLowerCase() == 'non-coffee') {
                                        $scope.isDRCOUPSpecialDiscountEnabled = true;
                                        $scope.isPERCARDSpecialDiscountEnabled = true;
                                    }

                                   
                                     checkCustUDF(cust);
                                });

                            }
                        });
                    // } else {
                        ModelService.get('Item', {document_sid: $stateParams.document_sid, cols: '*'}).then((items) => {
                                console.log(items);
                            for (var i = 0; i < items.length; i++) {

                                ModelService.get('Inventory', {sid: items[i].invn_sbs_item_sid}).then((invns) => {

                                    var invn = invns[0]; 
                                    console.log(invn);

                                    var codes = 'SP,SCPWDSP,NACSP,ALL';
                                    codes = codes.split(',');

                                    for (var x = 0; x < codes.length; x++) {
                                        if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                            $scope.isSoloParentSpecialDiscountEnabled = true;
                                        }
                                    }

                                    var codes = 'SCPWD,SCPWDSP,SCPWDNAC,ALL';
                                    codes = codes.split(',');

                                    for (var x = 0; x < codes.length; x++) {
                                        if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                            $scope.isSCSpecialDiscountEnabled = true;
                                            $scope.isPWDSpecialDiscountEnabled = true; 
                                        }
                                    }

                                    if ((invn.udf1_string).toLowerCase() == 'coffee' || (invn.udf1_string).toLowerCase() == 'non-coffee') {
                                        $scope.isDRCOUPSpecialDiscountEnabled = true;
                                        $scope.isPERCARDSpecialDiscountEnabled = true;
                                    }

                                    // var codes = '12ozCoffee';
                                    // codes = codes.split(',');

                                    // for (var x = 0; x < codes.length; x++) {
                                    //     if (codes[x] == invn.udf1_string.replace(/ /g,'')) {
                                    //         $scope.isBARFREESpecialDiscountEnabled = true;
                                    //     }
                                    // }

                                    checkCustUDF(cust);
                                });

                            }
                        });
                    // }
                } else {
                    ModelService.get('Item', {document_sid: $stateParams.document_sid, cols: '*'}).then((items) => {

                        for (var i = 0; i < items.length; i++) {

                            ModelService.get('Inventory', {sid: items[i].invn_sbs_item_sid}).then((invns) => {

                                var invn = invns[0]; 

                                var codes = 'SP,SCPWDSP,NACSP,ALL';
                                codes = codes.split(',');

                                for (var x = 0; x < codes.length; x++) {
                                    if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                        $scope.isSoloParentSpecialDiscountEnabled = true;
                                    }
                                }

                                var codes = 'SCPWD,SCPWDSP,SCPWDNAC,ALL';
                                codes = codes.split(',');

                                for (var x = 0; x < codes.length; x++) {
                                    if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                        $scope.isSCSpecialDiscountEnabled = true;
                                        $scope.isPWDSpecialDiscountEnabled = true; 
                                    }
                                }

                                var codes = 'NAC,NACSP,SCPWDNAC,ALL';
                                codes = codes.split(',');

                                for (var x = 0; x < codes.length; x++) {
                                    if (codes[x] == invn.dcs_code.replace(/ /g,'')) {
                                        $scope.isAthleteSpecialDiscountEnabled = true;
                                    }
                                }

                                if ((invn.udf1_string).toLowerCase() == 'coffee' || (invn.udf1_string).toLowerCase() == 'non-coffee') {
                                    $scope.isDRCOUPSpecialDiscountEnabled = true;
                                    $scope.isPERCARDSpecialDiscountEnabled = true;
                                }

                                // var codes = '12ozCoffee';
                                // codes = codes.split(',');

                                // for (var x = 0; x < codes.length; x++) {
                                //     if (codes[x] == invn.udf1_string.replace(/ /g,'')) {
                                //         $scope.isBARFREESpecialDiscountEnabled = true;
                                //     }
                                // }

                                if (config_special_discount_process_type == 'pharma') {
                                    checkCustUDF(cust);
                                }
                            });
                        }
                    });
                }
            });

        } else {
            ModelService.get('Item', {document_sid: $stateParams.document_sid, cols: '*'}).then((items) => {

                for (var i = 0; i < items.length; i++) {

                    ModelService.get('Inventory', {sid: items[i].invn_sbs_item_sid}).then((invns) => {

                        var invn = invns[0]; 

                        if ((invn.udf1_string).toLowerCase() == 'coffee' || (invn.udf1_string).toLowerCase() == 'non-coffee') {
                            $scope.isPERCARDSpecialDiscountEnabled = true;
                        }

                    });
                }
            });
        }

        setDefaultFields(doc, $http);

    });

    function checkCustUDF(cust) {
        if (config_special_discount_process_type == 'default' || config_special_discount_process_type == 'pharma') {
        
            // SC
            if ($scope.SCCustUDF >= 1 && $scope.SCCustUDF <= 6) {
                try {
                    if (cust['udf'+ $scope.SCCustUDF + 'string'] != 'SC') {
                        $scope.isSCSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isSCSpecialDiscountEnabled = false;
                }
                
            } else {
                var custextend = cust.custextend[0];

                try {
                    if (custextend['udf' + $scope.SCCustUDF + 'string'] != 'SC') {
                        $scope.isSCSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isSCSpecialDiscountEnabled = false;
                }
                
            }
            // PWD
            if ($scope.PWDCustUDF >= 1 && $scope.PWDCustUDF <= 6) {
                try {
                    if (cust['udf'+ $scope.PWDCustUDF + 'string'] != 'PWD') {
                        $scope.isPWDSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isPWDSpecialDiscountEnabled = false;
                }
                
            } else {
                var custextend = cust.custextend[0];
                // console.log(custextend);
                try {
                    if (custextend['udf' + $scope.PWDCustUDF + 'string'] != 'PWD') {
                        $scope.isPWDSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isPWDSpecialDiscountEnabled = false;
                }
                
            }
            // ATHLETE
            if ($scope.athleteCustUDF >= 1 && $scope.athleteCustUDF <= 6) {
                try {
                    if (cust['udf'+ $scope.athleteCustUDF + 'string'] != 'NAAC') {
                        $scope.isAthleteSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isAthleteSpecialDiscountEnabled = false;
                }
                
            } else {
                var custextend = cust.custextend[0];

                try {
                    if (custextend['udf' + $scope.athleteCustUDF + 'string'] != 'NAAC') {
                        $scope.isAthleteSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isAthleteSpecialDiscountEnabled = false;
                }
                
            }
            // SP
            if ($scope.soloParentCustUDF >= 1 && $scope.soloParentCustUDF <= 6) {
                try {
                    if (cust['udf'+ $scope.soloParentCustUDF + 'string'] != 'SP') {
                        $scope.isSoloParentSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isSoloParentSpecialDiscountEnabled = false;
                }
                
            } else {
                var custextend = cust.custextend[0];

                try {
                    if (custextend['udf' + $scope.soloParentCustUDF + 'string'] != 'SP') {
                        $scope.isSoloParentSpecialDiscountEnabled = false;
                    }
                }
                catch(err) {
                    $scope.isSoloParentSpecialDiscountEnabled = false;
                }
                
            } 

            // EMP
            if (cust['udf3string']) {
                if ((cust['udf3string']).toLowerCase() != 'employee' && (cust['udf3string']).toLowerCase() != 'barista') {
                    $scope.isEMPSpecialDiscountEnabled = false;
                }
            } else {
                $scope.isEMPSpecialDiscountEnabled = false;
            }
            
            if (!cust['notes']) {
                $scope.isEMPSpecialDiscountEnabled = false;
            }
            

            // BARISTA
            if (cust['udf3string']) {
                if ((cust['udf3string']).toLowerCase() != 'barista') {
                    $scope.isBARFREESpecialDiscountEnabled = false;
                }
            } else {
                $scope.isBARFREESpecialDiscountEnabled = false;
            }
            

            // DRCOUP
            if (cust['mark2']) {
                if (parseInt(cust['mark2']) <= 0) {
                    $scope.isDRCOUPSpecialDiscountEnabled = false;
                }
            } else {
                $scope.isDRCOUPSpecialDiscountEnabled = false;
            }
            
            // EXECFOC
            if (cust['udf2string']) {
                if ((cust['udf2string']).toLowerCase() != 'vip 1' && (cust['udf2string']).toLowerCase() != 'vip 2') {
                    $scope.isEXECFOCSpecialDiscountEnabled = false;
                }
            } else {
                $scope.isEXECFOCSpecialDiscountEnabled = false;
            }
            
            
        }

        if (!config_enable_special_discount_sc) {
            $scope.isSCSpecialDiscountEnabled = false;
        }
        
        if (!config_enable_special_discount_pwd) {
            $scope.isPWDSpecialDiscountEnabled = false;
        }

        if (!config_enable_special_discount_athlete) {
            $scope.isAthleteSpecialDiscountEnabled = false;
        }

        if (!config_enable_special_discount_solo_parent) {
            $scope.isSoloParentSpecialDiscountEnabled = false;
        }
    }

    $scope.SCPerc = config_special_discount_sc_perc;
    $scope.PWDPerc = config_special_discount_pwd_perc;
    $scope.athletePerc = config_special_discount_athlete_perc;
    $scope.soloParentPerc = config_special_discount_solo_parent_perc;

    $scope.SCLimit = config_special_discount_sc_limit;
    $scope.PWDLimit = config_special_discount_pwd_limit;
    $scope.athleteLimit = config_special_discount_athlete_limit;
    $scope.soloParentLimit = config_special_discount_solo_parent_limit;

    $scope.discountType = '';
    $scope.discountPerc = 0;
    $scope.discountLimit = 0;

    $scope.guestCount = 0;
    $scope.guestCountSCPWD = 0;
    $scope.SCPWDGuests = [];
    $scope.guestNames = [];
    $scope.guestTins = [];
    $scope.guestIds = [];

    $scope.items = [];

    $scope.closeModal = function(){
        $uibModalInstance.dismiss();
        $state.go($state.current, {}, {reload: true});
    };

    $scope.changeDiscountType = function() {

        switch ($scope.discountType) {
            case 'SC':
                $scope.discountPerc = $scope.SCPerc;
                $scope.discountLimit = $scope.SCLimit;
                break;
            case 'PWD':
                $scope.discountPerc = $scope.PWDPerc;
                $scope.discountLimit = $scope.PWDLimit;
                break;
            case 'ATHLETE':
                $scope.discountPerc = $scope.athletePerc;
                $scope.discountLimit = $scope.athleteLimit;
                break;
            case 'SP':
                $scope.discountPerc = $scope.soloParentPerc;
                $scope.discountLimit = $scope.soloParentLimit;
                break;
            default:
                $scope.discountPerc = 0;
                break;
        }
    }

    $scope.changeSCPWDGuestCount = function() {
        $scope.SCPWDGuests = [];
        for (var i = 0; i < $scope.guestCountSCPWD; i++) {
            $scope.SCPWDGuests.push(i);
        }
    }



    function checkIfSpecialDiscountExisted(discountType, item) {
        return new Promise(function(resolve, reject) {
            var discLength = item.discounts.length;

            if (!discLength) {
                resolve(true);
            }

            item.discounts.forEachWithCallback((el, i, next) => {

                $http.get(el.link + '?cols=*').then((res) => {
                   // console.log(res.length);
                    if (typeof res.data !== 'undefined') {
                        var disc = res.data[0];
                        // console.log(res);
                        if (disc.disc_reason == discountType) {
                            reject();
                        }
                    }

                    if (i == discLength) {
                        resolve(true);
                    }
                    next();
                });
            
            });
        });
    }

    function checkIfGlobalSpecialDiscountExisted(discountType, doc) {
        return new Promise(function(resolve, reject) {
            var discLength = doc.discounts.length;

            if (!discLength) {
                resolve(true);
            }

            doc.discounts.forEachWithCallback((el, i, next) => {

                $http.get(el.link + '?cols=*').then((res) => {
                   // console.log(res.length);
                    if (typeof res.data !== 'undefined') {
                        var disc = res.data[0];
                        // console.log(res);
                        if (disc.disc_reason == discountType) {
                            reject();
                        }
                    }

                    if (i == discLength) {
                        resolve(true);
                    }
                    next();
                });
            
            });
        });
    }

    function checkIfCouponExisted(couponCode, doc) {
        return new Promise(function(resolve, reject) {

            ModelService.get('DocumentCoupon', {document_sid: doc.sid}).then(function(coupons){

                var coupLength = coupons.length;

                if (!coupLength) {
                    resolve(true);
                }

                coupons.forEachWithCallback((el, i, next) => {
                    // console.log(el);
                    // console.log(couponCode);
                    if (el.coupon_code == couponCode) {
                        reject();
                    }

                    if (i == coupLength) {
                        resolve(true);
                    }
                    next();
                
                });
            });

        });
    }

    function checkIfAnyPromoDiscountExisted(item) {
        return new Promise(function(resolve, reject) {
            var discLength = item.discounts.length;

            if (!discLength) {
                resolve(false);
            }

            item.discounts.forEachWithCallback((el, i, next) => {

                $http.get(el.link + '?cols=*').then((res) => {

                    if (res.length) {
                        var disc = res.data[0];

                        if (disc.disc_promo_name != '') {
                            resolve(disc);
                        }
                    }
                    
                    if (i == discLength) {
                        resolve(false);
                    }
                    next();
                });
            
            });
        });
    }

    function getItemsSpecialDiscountsEstimation(items) {
        return new Promise(function(resolve, reject) {
            var itemsLen = items.length

            var estimatedTotalDisc = 0;
            var totalQty = 0;

            items.forEachWithCallback((el, i, next) => {
                if ($scope.discountType == 'SC' || $scope.discountType == 'PWD' || $scope.discountType == 'SP') {
                    estimatedTotalDisc += ((el.original_price) * ($scope.discountPerc / 100) * el.quantity);
                } else {
                    estimatedTotalDisc += ((el.price - el.tax_amount - el.tax2_amount) * ($scope.discountPerc / 100) * el.quantity);
                }
                
                totalQty += el.quantity;

                if (i == itemsLen) {
                    resolve({
                        est: estimatedTotalDisc,
                        totalQty: totalQty,
                        items: items
                     });
                }
                next();
            });
        });
    }

    function getItemsSpecialDiscountsEstimation2(items) {
        return new Promise(function(resolve, reject) {
            console.log(items);
            var itemsLen = items.length

            var estimatedTotalDisc = 0;
            var totalQty = 0;

            // items.forEachWithCallback((el, i, next) => {
            //     if ($scope.discountType == 'SC' || $scope.discountType == 'PWD' || $scope.discountType == 'SP') {
            //         estimatedTotalDisc += ((el.original_price) * ($scope.discountPerc / 100) * el.quantity);
            //     } else {
            //         estimatedTotalDisc += ((el.price - el.tax_amount - el.tax2_amount) * ($scope.discountPerc / 100) * el.quantity);
            //     }
                
            //     totalQty += el.quantity;

            //     if (i == itemsLen) {
                    resolve({
                        est: estimatedTotalDisc,
                        totalQty: totalQty,
                        items: items
                     });
            //     }
            //     next();
            // });
        });
    }

    function getPrevDocsSpecialDiscountsTotal(diff, doc) {
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
                                                if (disc.disc_reason == $scope.discountType) {
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


    function setDiscountTypeInfo(discountType) {

        switch (discountType) {
            case 'SC':
                $scope.discountPerc = $scope.SCPerc;
                $scope.discountLimit = $scope.SCLimit;
                break;
            case 'PWD':
                $scope.discountPerc = $scope.PWDPerc;
                $scope.discountLimit = $scope.PWDLimit;
                break;
            case 'ATHLETE':
                $scope.discountPerc = $scope.athletePerc;
                $scope.discountLimit = $scope.athleteLimit;
                break;
            case 'SP':
                $scope.discountPerc = $scope.soloParentPerc;
                $scope.discountLimit = $scope.soloParentLimit;
                break;
            default:
                $scope.discountPerc = 0;
                break;
        }
    }


    function getDocItemsDiscsData(docSid, ModelService, $http) {
        return new Promise(function(resolve, reject) {

                console.log(docSid);
            ModelService.get('Item', {document_sid: docSid, cols: '*'}).then(function(items){
                console.log(items);
                var itemsLen = items.length;

                var tempData = [];

                items.forEachWithCallback((el, i, next) => {

                    ModelService.get('Inventory', {sid: el.invn_sbs_item_sid}).then((invns) => {

                        var invn = invns[0];

                        if (invn.dcs_code.replace(/ /g,'') == 'ALL' || invn.dcs_code.replace(/ /g,'') == 'SCPWD' || invn.dcs_code.replace(/ /g,'') == 'SCPWDSP' || invn.dcs_code.replace(/ /g,'') == 'SCPWDNAC') {
                            console.log(el);
                            if (el.price_before_detax) {
                                var itemDisc = (el.price_before_detax * (5 / 100) * el.quantity);
                                var price = el.price_before_detax;
                            } else {
                                var itemDisc = (el.price * (5 / 100) * el.quantity);
                                var price = el.price;
                            }

                            tempData.push({
                                sid: el.sid,
                                price: price,
                                itemDisc: itemDisc
                            });

                            if (itemsLen == i) {
                                resolve(tempData);
                            } else {
                                next();
                            }
                        } else {
                            if (itemsLen == i) {
                                resolve(tempData);
                            } else {
                                next();
                            }
                        }
                    });
                });
            });

        });
    }

    $scope.applyGlobalSpecialDiscount = function(discountType) {
        $scope.discountType = discountType;

        var docSid = $stateParams.document_sid;

        setDiscountTypeInfo(discountType);

        var discountLimit  =  $scope.discountLimit;

        var modalOptions = {
            backdrop: 'static',
            size: 'md', // sm, md, lg
            templateUrl: '/plugins/PLSpecialDiscounts/modal_globalSpecialDiscount.htm',
            keyboard: false,
            controller: function($scope, $uibModalInstance, $http, $uibModalStack, ModelService, LoadingScreen, $state) {
                $scope.maxDiscount = (discountLimit * 0.05);
                $scope.discountAmount = null;

                getDocItemsDiscsData(docSid, ModelService, $http).then((items) => {

                    var temp = 0;

                    if (items.length) {
                        for (var i=0; i<items.length; i++) {
                            temp += items[i].itemDisc;
                        }
                    }

                    if (temp < $scope.maxDiscount) {
                        $scope.maxDiscount = temp;
                    }
                });

                $scope.closeModal = function() {
                    $uibModalInstance.dismiss('cancel');
                }

                $scope.closeAll = function() {
                    $uibModalInstance.dismiss('cancel');
                }

                $scope.apply = function() {
                    if ($scope.discountAmount > $scope.maxDiscount) {
                        RN.showError('Error', 'Unable to apply discount. The amount has exceeded the special discount limit.');
                        return;
                    } else {


                        LoadingScreen.Enable = 1;

                        ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {

                            checkIfGlobalSpecialDiscountExisted(discountType, documents[0]).then((success) => {
                                var doc = documents[0];
                                doc.manual_disc_reason = discountType;
                                doc.manual_disc_type = 2;
                                doc.manual_disc_value = $scope.discountAmount;

                                doc.save().then(() => {

                                    RN.showSuccessfulMessage('Success', 'Success on applying '+ discountType+' special discount.');

                                    LoadingScreen.Enable = 0;

                                    setTimeout(() => {
                                        $state.go($state.current, {}, {reload: true});
                                    }, 1000);

                                    $uibModalStack.dismissAll();
                                }, () => {
                                    LoadingScreen.Enable = 0;
                                });
                            }, (err) => {
                                RN.showError('Error', 'Same global special discount has already been applied.');
                                 LoadingScreen.Enable = 0;
                            })
                            
                        }, () => {
                            LoadingScreen.Enable = 0;
                        });
                    }
                }
            }
        };
        
        $uibModal.open(modalOptions);
    }

    $scope.applySpecialDiscount = function(discountType) {

        $scope.discountType = discountType;

        var docSid = $stateParams.document_sid;

        setDiscountTypeInfo(discountType);

        if (discountType == 'SC' || discountType == 'PWD' || discountType == 'ATHLETE' || discountType == 'SP') {

            LoadingScreen.Enable = 1;

            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                var today = moment();
                var diff = today.subtract(7, 'days');
                    diff = diff.format("YYYY-MM-DDTHH:mm");

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                    
                    if ($scope.discountLimit) {

                         getPrevDocsSpecialDiscountsTotal(diff, doc).then((totalPrevDisc) => {
                            console.log(totalPrevDisc);
                            if (totalPrevDisc >= $scope.discountLimit) {
                                RN.showError('Error', 'Unable to apply discount. The customer has exceeded the special discount limit.');
                            } else {

                                var remaining = $scope.discountLimit - totalPrevDisc;

                                if (remaining <= 0.25) {
                                    RN.showError('Error', 'Unable to apply discount. The customer has exceeded the special discount limit.');
                                } else {
                                
                                    getItemsSpecialDiscountsEstimation(items).then((est) => {

                                        var totalDiscsToApply = est.est;
                                        if (est.est > remaining) {
                                            totalDiscsToApply = remaining;
                                        }

                                        
                                        if (config_special_discount_process_type == 'restaurant') {
                                            if ($scope.guestCount) {
                                                doc.manual_disc_reason = $scope.discountType;
                                                doc.manual_disc_type = 2;
                                                doc.manual_disc_value = (((doc.transaction_total_amt/$scope.guestCount)*$scope.guestCountSCPWD)/1.12) * ($scope.discountPerc / 100);

                                                doc.save().then(() => {
                                                    LoadingScreen.Enable = 0;

                                                    modifyCallback();

                                                    setTimeout(() => {
                                                        $state.go($state.current, {}, {reload: true});
                                                    }, 1000);
                                                    $scope.closeModal();
                                                });

                                                RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                            } else {
                                                LoadingScreen.Enable = 0;
                                                RN.showWarning('Warning', 'No special discount applied. No. of guest count is required.');
                                            }
                                        } else {
                                            applyItemsDiscount(totalDiscsToApply, est.totalQty).then(() => {
                                                RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');

                                                LoadingScreen.Enable = 0;

                                                modifyCallback();

                                                setTimeout(() => {
                                                    $state.go($state.current, {}, {reload: true});
                                                }, 1000);
                                                $scope.closeModal();
                                            });
                                        }
                                    });
                                }
                            }
                        });
                        
                    } else {
                        getItemsSpecialDiscountsEstimation(items).then((est) => {

                            var totalDiscsToApply = est.est;

                            
                            if (config_special_discount_process_type == 'restaurant') {
                                if ($scope.guestCount) {
                                    console.log(doc);

                                    doc.manual_disc_reason = $scope.discountType;
                                    doc.manual_disc_type = 2;
                                    doc.manual_disc_value = (((doc.transaction_total_amt/$scope.guestCount)*$scope.guestCountSCPWD)/1.12) * ($scope.discountPerc / 100);

                                    doc.udf_float01 = $scope.guestCount
                                    doc.udf_float02 = $scope.guestCountSCPWD;
                                    doc.udf_string01 = $scope.guestNames.join(",");
                                    doc.udf_string02 = $scope.guestTins.join(",");
                                    doc.udf_string03 = $scope.guestIds.join(",");

                                    doc.save().then(() => {
                                        LoadingScreen.Enable = 0;

                                        modifyCallback();

                                        setTimeout(() => {
                                            $state.go($state.current, {}, {reload: true});
                                        }, 1000);
                                        $scope.closeModal();
                                    });

                                    RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                } else {
                                    LoadingScreen.Enable = 0;
                                    RN.showWarning('Warning', 'No special discount applied. No. of guest count is required.');
                                }
                            } else {

                                applyItemsDiscount(totalDiscsToApply, est.totalQty).then(() => {
                                    // doc.udf_float01 = $scope.guestCount
                                    // doc.udf_float02 = $scope.guestCountSCPWD;
                                    // doc.udf_string01 = $scope.guestNames.join(",");
                                    // doc.udf_string02 = $scope.guestTins.join(",");
                                    // doc.udf_string03 = $scope.guestIds.join(",");

                                    // doc.save().then(() => {
                                        LoadingScreen.Enable = 0;

                                        modifyCallback();

                                        setTimeout(() => {
                                            $state.go($state.current, {}, {reload: true});
                                        }, 1000);
                                        $scope.closeModal();
                                    // });

                                    RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                });
                            }
                                
                        });
                    }
                });
            });

        } else if (discountType == 'EMP') {
            LoadingScreen.Enable = 1;

            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                    applyEmployeeItemsDiscount(items, doc).then(() => {

                        RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType + ' special discount.');

                        LoadingScreen.Enable = 0;

                        setTimeout(() => {
                            $state.go($state.current, {}, {reload: true});
                        }, 1000);

                        $scope.closeModal();
                    });
                });
            });

        } else if (discountType == 'MA') {
            var modalOptions = {
                backdrop: 'static',
                size: 'md', // sm, md, lg
                templateUrl: '/plugins/PLSpecialDiscounts/managerOverrideModal.htm',
                keyboard: false,
                controller: function($scope, $uibModalInstance, $http, $uibModalStack) {
                    $scope.username = "";
                    $scope.password = "";
                    $scope.close = function() {
                        $uibModalInstance.dismiss('cancel');
                    }
                    $scope.override = function() {
                        if ($scope.username == "" || $scope.password == "") {
                            RN.showError('Warning', 'Wrong username or password.');   
                        } else {
                            getEmployee($scope.username, $scope.password, $http, ModelService2).then((emp) => {
                                if (emp) {
                                    LoadingScreen.Enable = 1;

                                    ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                                        var doc = documents[0];

                                        ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                                            applyManagerItemsDiscount(items).then(() => {

                                                RN.showSuccessfulMessage('Success', 'Success on applying Manager\'s special discount.');

                                                LoadingScreen.Enable = 0;

                                                setTimeout(() => {
                                                    $state.go($state.current, {}, {reload: true});
                                                }, 1000);

                                                $uibModalStack.dismissAll();
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            };
            
            $uibModal.open(modalOptions);

        } else if (discountType == 'BARFREE') {
            // var modalOptions = {
            //     backdrop: 'static',
            //     size: 'md', // sm, md, lg
            //     templateUrl: '/plugins/PLSpecialDiscounts/managerOverrideModal.htm',
            //     keyboard: false,
            //     controller: function($scope, $uibModalInstance, $http, $uibModalStack) {
            //         $scope.username = "";
            //         $scope.password = "";
            //         $scope.close = function() {
            //             $uibModalInstance.dismiss('cancel');
            //         }
            //         $scope.override = function() {
            //             if ($scope.username == "" || $scope.password == "") {
            //                 RN.showError('Warning', 'Wrong username or password.');   
            //             } else {
            //                 getEmployee($scope.username, $scope.password, $http, ModelService2).then((emp) => {
            //                     if (emp) {
            //                         LoadingScreen.Enable = 1;

            //                         ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
            //                             var doc = documents[0];

            //                             ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

            //                                 applyBaristaItemsDiscount(items).then((success) => {

            //                                     if (success) {
            //                                         RN.showSuccessfulMessage('Success', 'Success on applying Barista special discount.');
            //                                     } else {
            //                                         RN.showError('Error', 'Unable to apply discount. No available 12oz drink with 1 quantity.');
            //                                     }


            //                                     LoadingScreen.Enable = 0;

            //                                     setTimeout(() => {
            //                                         $state.go($state.current, {}, {reload: true});
            //                                     }, 1000);

            //                                     $uibModalStack.dismissAll();
            //                                 });
            //                             });
            //                         });
            //                     }
            //                 });
            //             }
            //         }
            //     }
            // };
            
            // $uibModal.open(modalOptions);

            LoadingScreen.Enable = 1;
        
            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                    applyBaristaItemsDiscount(items).then((success) => {

                            if (success) {
                                RN.showSuccessfulMessage('Success', 'Success on applying Barista special discount.');
                            } else {
                                RN.showError('Error', 'Unable to apply discount. No available 12oz drink with 1 quantity.');
                            }


                            LoadingScreen.Enable = 0;

                            setTimeout(() => {
                                $state.go($state.current, {}, {reload: true});
                            }, 1000);

                            $scope.closeModal();
                        });
                });
            });

        } else if (discountType == 'DRCOUP') {
            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                    applyDrinksCouponItemsDiscount(doc, items).then(() => {

                        RN.showSuccessfulMessage('Success', 'Success on applying Drink Coupon special discount.');

                        LoadingScreen.Enable = 0;

                        setTimeout(() => {
                            $state.go($state.current, {}, {reload: true});
                        }, 1000);

                        $scope.closeModal();

                    });
                });
            });


        } else if (discountType == 'PERCARD') {
            LoadingScreen.Enable = 1;
            
            var coupon = ModelService.create('DocumentCoupon');
            coupon.doc_sid = docSid;
            coupon.document_sid = docSid;
            coupon.coupon_code = config_special_discount_percentage_card_name;
            coupon.in_or_out = 1;
            coupon.insert({document_sid: docSid}).then(() => {
                RN.showSuccessfulMessage('Success', 'Success on applying Percentage Card special discount.');

                LoadingScreen.Enable = 0;

                setTimeout(() => {
                    $state.go($state.current, {}, {reload: true});
                }, 1000);

                $scope.closeModal();

            }); // run insert function on created model object

        } else if (discountType == 'MARKFOC') {
            var modalOptions = {
                backdrop: 'static',
                size: 'md', // sm, md, lg
                templateUrl: '/plugins/PLSpecialDiscounts/managerOverrideModal.htm',
                keyboard: false,
                controller: function($scope, $uibModalInstance, $http, $uibModalStack) {
                    $scope.username = "";
                    $scope.password = "";
                    $scope.close = function() {
                        $uibModalInstance.dismiss('cancel');
                    }
                    $scope.override = function() {
                        if ($scope.username == "" || $scope.password == "") {
                            RN.showError('Warning', 'Wrong username or password.');   
                        } else {
                            getEmployee($scope.username, $scope.password, $http, ModelService2).then((emp) => {
                                if (emp) {
                                console.log(emp);
                                    LoadingScreen.Enable = 1;

                                    ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                                        var doc = documents[0];

                                        ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                                            applyMarkItemsDiscount(doc, items, emp).then(() => {

                                                RN.showSuccessfulMessage('Success', 'Success on applying Mark FOC special discount.');

                                                LoadingScreen.Enable = 0;

                                                setTimeout(() => {
                                                    $state.go($state.current, {}, {reload: true});
                                                }, 1000);

                                                $uibModalStack.dismissAll();
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            };

            $uibModal.open(modalOptions);

        } else if (discountType == 'EXECFOC') {
            var modalOptions = {
                backdrop: 'static',
                size: 'md', // sm, md, lg
                templateUrl: '/plugins/PLSpecialDiscounts/managerOverrideModal.htm',
                keyboard: false,
                controller: function($scope, $uibModalInstance, $http, $uibModalStack) {
                    $scope.username = "";
                    $scope.password = "";
                    $scope.close = function() {
                        $uibModalInstance.dismiss('cancel');
                    }
                    $scope.override = function() {
                        if ($scope.username == "" || $scope.password == "") {
                            RN.showError('Warning', 'Wrong username or password.');   
                        } else {
                            getEmployee($scope.username, $scope.password, $http, ModelService2).then((emp) => {
                                if (emp) {
                                    LoadingScreen.Enable = 1;

                                    ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                                        var doc = documents[0];

                                        ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                                            applyExecutiveItemsDiscount(items).then(() => {

                                                RN.showSuccessfulMessage('Success', 'Success on applying Executive FOC special discount.');

                                                LoadingScreen.Enable = 0;

                                                setTimeout(() => {
                                                    $state.go($state.current, {}, {reload: true});
                                                }, 1000);

                                                $uibModalStack.dismissAll();
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            };

            $uibModal.open(modalOptions);

        }

        
    }


    function applyEmployeeItemsDiscount(items, doc) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            items.forEachWithCallback((el, i, next) => {
                console.log(el);
                if ((el.udf_string01).toLowerCase() == 'merchandise') {

                    checkIfSpecialDiscountExisted('EMPMDisc10', el).then(() => {

                        // var coupon = ModelService.create('DocumentCoupon');
                        // coupon.doc_sid = doc.sid;
                        // coupon.document_sid = doc.sid;
                        // coupon.coupon_code = config_special_discount_employee_10_coupon_name;
                        // coupon.in_or_out = 1;
                        // coupon.insert({document_sid: doc.sid}).then(() => {
                        //     if (itemsLen == i) {
                        //         resolve(true);
                        //     } else {
                        //         next();
                        //     }
                        // }); // run insert function on created model object

                        ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                            var tempItem = tempItems[0];

                            tempItem.manual_disc_reason = 'EMPMDisc10';
                            var discValue = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (10 / 100)) * el.quantity;
                            var discValueValidation = ((el.price - el['note' + modifier1Text2NoteNo]) * (10 / 100)) * el.quantity;
                            if (discValueValidation > 0) {
                                tempItem.manual_disc_type = 2;
                                tempItem.manual_disc_value = discValue;

                                tempItem.save().then(() => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
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

                    }, () => {

                        if (itemsLen == i) {
                            resolve(true);
                        } else {
                            next();
                        }
                    });
                }  else {

                    checkIfSpecialDiscountExisted('EMPMDisc20', el).then(() => {
                    // checkIfCouponExisted(config_special_discount_employee_20_coupon_name, doc).then(() => {

                        // var coupon = ModelService.create('DocumentCoupon');
                        // coupon.doc_sid = doc.sid;
                        // coupon.document_sid = doc.sid;
                        // coupon.coupon_code = config_special_discount_employee_20_coupon_name;
                        // coupon.in_or_out = 1;
                        // coupon.insert({document_sid: doc.sid}).then(() => {
                        //     if (itemsLen == i) {
                        //         resolve(true);
                        //     } else {
                        //         next();
                        //     }
                        // }); // run insert function on created model object

                        ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                            var tempItem = tempItems[0];

                            tempItem.manual_disc_reason = 'EMPMDisc20';

                            var discValue = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (20 / 100)) * el.quantity;
                            var discValueValidation = ((el.price - el['note' + modifier1Text2NoteNo]) * (20 / 100)) * el.quantity;

                            if (discValueValidation > 0) {
                                tempItem.manual_disc_type = 2;
                                tempItem.manual_disc_value = discValue;
                                tempItem.save().then(() => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
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

                    }, () => {

                        if (itemsLen == i) {
                            resolve(true);
                        } else {
                            next();
                        }
                    });
                }                   
            });
        });
    }

    function applyManagerItemsDiscount(items) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            items.forEachWithCallback((el, i, next) => {

                if ((el.udf_string01).toLowerCase() == 'merchandise') {

                    checkIfSpecialDiscountExisted('MANDisc10', el).then(() => {

                        ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                            var tempItem = tempItems[0];

                            tempItem.manual_disc_reason = 'MANDisc10';
                            var discValue = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (10 / 100)) * el.quantity;
                            var discValueValidation = ((el.price - el['note' + modifier1Text2NoteNo]) * (10 / 100)) * el.quantity;

                            if (discValueValidation > 0) {
                                tempItem.manual_disc_type = 2;
                                tempItem.manual_disc_value = discValue;
                                tempItem.save().then(() => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
                                    }
                                }, () => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
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

                    }, () => {

                        if (itemsLen == i) {
                            resolve(true);
                        } else {
                            next();
                        }
                    });
                }  else {

                    checkIfSpecialDiscountExisted('MANDisc20', el).then(() => {

                        ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                            var tempItem = tempItems[0];

                            tempItem.manual_disc_reason = 'MANDisc20';
                            var discValue = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (20 / 100)) * el.quantity;
                            var discValueValidation = ((el.price - el['note' + modifier1Text2NoteNo]) * (20 / 100)) * el.quantity;
                            if (discValueValidation > 0) {
                                tempItem.manual_disc_type = 2;
                                tempItem.manual_disc_value = discValue;
                                tempItem.save().then(() => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
                                    }
                                }, () => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
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

                    }, () => {

                        if (itemsLen == i) {
                            resolve(true);
                        } else {
                            next();
                        }
                    });
                }                   
            });
        });
    }


    function applyBaristaItemsDiscount(items) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            var count = 0;

            checkAnyItemsIfHasBaristaDiscounts(items).then((items) => {

                if (items) {

                    items.forEachWithCallback((el, i, next) => {

                        if (count <= 0) {

                            if (((el.udf_string01).toLowerCase() == 'coffee' || (el.udf_string01).toLowerCase() == 'non-coffee') && el.quantity == 1) {

                                checkIfSpecialDiscountExisted('BARFREE', el).then(() => {

                                    ModelService.get('Inventory', {sid: el.invn_sbs_item_sid, cols: '*'}).then((invns) => {

                                        var invn = invns[0];

                                        if ((invn.item_size).toLowerCase() == '12oz') {

                                            ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                                                var tempItem = tempItems[0];

                                                tempItem.manual_disc_reason = 'BARFREE';
                                                // tempItem.manual_disc_type = 2;
                                                // tempItem.manual_disc_value = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (100 / 100)); 

                                                tempItem.manual_disc_type = 1;
                                                tempItem.manual_disc_value = 100;

                                                tempItem.save().then(() => {
                                                    count++;
                                                    if (itemsLen == i) {
                                                        if (count <= 0) {
                                                            resolve(false);
                                                        } else {
                                                            resolve(true);
                                                        }
                                                    } else {
                                                        next();
                                                    }
                                                }, () => {
                                                    if (itemsLen == i) {
                                                        if (count <= 0) {
                                                            resolve(false);
                                                        } else {
                                                            resolve(true);
                                                        }
                                                    } else {
                                                        next();
                                                    }
                                                });
                                            });
                                        } else {
                                            if (itemsLen == i) {
                                                if (count <= 0) {
                                                    resolve(false);
                                                } else {
                                                    resolve(true);
                                                }
                                            } else {
                                                next();
                                            }
                                        }
                                    });

                                }, () => {

                                    if (itemsLen == i) {
                                        if (count <= 0) {
                                            resolve(false);
                                        } else {
                                            resolve(true);
                                        }
                                    } else {
                                        next();
                                    }
                                });
                            } else {
                                if (itemsLen == i) {
                                    if (count <= 0) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                } else {
                                    next();
                                }
                            } 
                        } else {
                            if (itemsLen == i) {
                                if (count <= 0) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            } else {
                                next();
                            }
                        }                 
                    });
                } else {
                    resolve(true);
                }
            });

            
        });

    }

    function checkAnyItemsIfHasBaristaDiscounts(items) {
        return new Promise((resolve) => {
            var itemsLen = items.length;

            var tempItems = [];
 
            items.forEachWithCallback((el, i, next) => {

                tempItems.push(el);

                checkIfSpecialDiscountExisted('BARFREE', el).then(() => {
                    if (itemsLen == i) {
                        resolve(tempItems);
                    } else {
                        next();
                    }
                }, () => {
                    resolve(false);
                });
            });
        });
    }

    function applyExecutiveItemsDiscount(items) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            items.forEachWithCallback((el, i, next) => {

                if ((el.udf_string01).toLowerCase() != 'merchandise') {

                    checkIfSpecialDiscountExisted('EXECFOC', el).then(() => {

                        ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                            var tempItem = tempItems[0];

                            tempItem.manual_disc_reason = 'EXECFOC';
                            // tempItem.manual_disc_type = 2;
                            // tempItem.manual_disc_value = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (100 / 100)) * el.quantity;
                            tempItem.manual_disc_type = 1;
                            tempItem.manual_disc_value = 100;

                            tempItem.save().then(() => {
                                if (itemsLen == i) {
                                    resolve(true);
                                } else {
                                    next();
                                }
                            }, () => {
                                if (itemsLen == i) {
                                    resolve(true);
                                } else {
                                    next();
                                }
                            });
                        });

                    }, () => {

                        if (itemsLen == i) {
                            resolve(true);
                        } else {
                            next();
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
        });
    }


    function applyDrinksCouponItemsDiscount(doc, items) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            var total = 0;

            items.forEachWithCallback((el, i, next) => {

                if ((el.udf_string01).toLowerCase() == 'coffee' || (el.udf_string01).toLowerCase() == 'non-coffee') {
                    ModelService2.get('Customer', {sid: doc.bt_cuid, cols: "*,custextend.*"}).then((custs) => {

                        var cust = custs[0];

                        if ((total + el.quantity) <= parseInt(cust.mark2)) {

                            checkIfSpecialDiscountExisted('DRCOUP', el).then(() => {

                                ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                                    var tempItem = tempItems[0];

                                    tempItem.manual_disc_reason = 'DRCOUP';
                                    // tempItem.manual_disc_type = 2;
                                    // tempItem.manual_disc_value = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (100 / 100)) * el.quantity;

                                    tempItem.manual_disc_type = 1;
                                    tempItem.manual_disc_value = 100;

                                    tempItem.save().then(() => {

                                        total += el.quantity;

                                        //cust.mark2 = (parseInt(cust.mark2) - el.quantity).toString();
                                        //cust.save().then(() => {

                                            if (itemsLen == i) {
                                                resolve(true);
                                            } else {
                                                next();
                                            }

                                        //});

                                    }, () => {
                                        if (itemsLen == i) {
                                            resolve(true);
                                        } else {
                                            next();
                                        }
                                    });
                                });

                            }, () => {

                                if (itemsLen == i) {
                                    resolve(true);
                                } else {
                                    next();
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

                } else {
                    if (itemsLen == i) {
                        resolve(true);
                    } else {
                        next();
                    }
                }
                
            });
        });
    }


    function applyMarkItemsDiscount(doc, items, dataEmp) {
        return new Promise((resolve) => {

            var itemsLen = items.length;

            if (!itemsLen) {
                resolve(true);
            }

            var total = 0;

            items.forEachWithCallback((el, i, next) => {


                ModelService2.get('Employee', {sid: dataEmp.sid}).then((emps) => {

                    var emp = emps[0];
                    console.log(emp);
                    var discValue = ((el.original_price - el['note' + modifier1Text2NoteNo]) * (100 / 100)) * el.quantity;

                    if ((total + discValue) <= parseFloat(emp.udf4string)) {

                        checkIfSpecialDiscountExisted('MARKFOC', el).then(() => {

                            ModelService.get('Item', {sid: el.sid, document_sid: el.document_sid, cols: '*'}).then((tempItems) => {

                                var tempItem = tempItems[0];

                                tempItem.manual_disc_reason = 'MARKFOC';
                                tempItem.manual_disc_type = 2;
                                tempItem.manual_disc_value = discValue;

                                tempItem.save().then(() => {
                                    sessionStorage.setItem('employee_mark_foc', emp.sid);
                                    sessionStorage.setItem('employee_mark_foc_auth_session', dataEmp.auth_session);
                                    sessionStorage.setItem('employee_mark_foc_row_version', emp.rowversion);

                                    total += discValue;

                                    //emp.mark2 = (parseFloat(emp.mark2) - discValue).toString();
                                    //emp.save().then(() => {

                                        if (itemsLen == i) {
                                            resolve(true);
                                        } else {
                                            next();
                                        }

                                    //});

                                }, () => {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
                                    }
                                });
                            });

                        }, () => {

                            if (itemsLen == i) {
                                resolve(true);
                            } else {
                                next();
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

                
            });
        });
    }


    function getEmployee(username, password, $http, ModelService2) {
        return new Promise((resolve) => {

            // {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}
            $http.get('v1/rest/auth', {headers: {"Auth-Session": null}}).then(function(auth){

                if (auth.status == 200) {
                    var authNonce = auth.headers('auth-nonce');
                    var authNonceResponse = ((parseInt((authNonce) / 13) % 99999) * 17);

                    $http.get('v1/rest/auth?usr=' + username + '&pwd=' + password, {headers: {"Auth-Session": null, "Auth-Nonce": authNonce, "Auth-Nonce-Response": authNonceResponse}}).then(function(auth){                    
                        if (auth.status == 200) {
                            var session = auth.headers('auth-session');

                            $http.get('v1/rest/session', {headers: {"Auth-Session": session}}).then(function(auth){   

                                if (auth.status == 200) {
                                    ModelService2.get('Employee', {sid: auth.data[0].employeesid, cols: "*,emplphone.*,empladdress.*,emplemail.*,employeeextend.*,employeestore.*,employeesubsidiary.*,usergroupuser.*"}).then((employees) => {
                                        var employee = employees[0];
                                        employee.auth_session = session;
                                        console.log(employee);
                                        var passed = false; 

                                        var usergroupuser = employee.usergroupuser;

                                        for (var i = 0; i < usergroupuser.length; i++) {
                                            if ((usergroupuser[i].usergroupname).toLowerCase() == 'store manager/supervisor') {
                                                passed = true;
                                            }
                                        }

                                        if (passed) {
                                            // $http.get('v1/rest/sit?ws=webclient', {headers: {"Auth-Session": session}}).then(function(auth){   
                                                resolve(employee);
                                            // });
                                        } else {
                                            RN.showError('Error', 'Unauthorized.');
                                            resolve(false);
                                        }
                                        
                                    });
                                } else {
                                    RN.showError('Error', 'Invalid username or password.');
                                    resolve(false);
                                }

                            }, (err) => {
                                RN.showError('Error', err.data[0].errormsg);
                                resolve(false);
                            });

                        } else {
                            RN.showError('Error', 'Invalid username or password.');
                            resolve(false);
                        }

                    }, (err) => {
                        RN.showError('Error', err.data[0].errormsg);
                        resolve(false);
                    });

                } else {
                    RN.showError('Error', 'Invalid username or password.');
                    resolve(false);
                }
                
            });
        });
    }

    


    function applyItemsDiscount(totalDiscsToApply, totalQty) {

        return new Promise(function(resolve, reject) {

            var docSid = $stateParams.document_sid;

            ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {

                var itemsLen = items.length;

                items.forEachWithCallback((el, i, next) => {
                    // console.log(itemsLen, i);

                    checkIfSpecialDiscountExisted($scope.discountType, el).then(() => {

                        ModelService.get('Inventory', {sid: el.invn_sbs_item_sid}).then((invns) => {

                            var invn = invns[0];
                            // console.log(invn);

                            if ($scope.discountType == 'SC' || $scope.discountType == 'PWD' || $scope.discountType == 'SP') {
                                if (invn.dcs_code.replace(/ /g,'') == 'ALL' || invn.dcs_code.replace(/ /g,'') == 'SCPWD' || invn.dcs_code.replace(/ /g,'') == 'SCPWDSP' || invn.dcs_code.replace(/ /g,'') == 'SCPWDNAC') {
                                    
                                    if (el.price_before_detax) {
                                        var itemDisc = (el.price_before_detax * ($scope.discountPerc / 100) * el.quantity);
                                    } else {
                                        var itemDisc = (el.price * ($scope.discountPerc / 100) * el.quantity);
                                    }
                                    console.log(el, itemDisc, totalDiscsToApply);
                                    if (itemDisc > totalDiscsToApply && $scope.discountLimit > 0) {
                                        itemDisc = (totalDiscsToApply * 1.12);
                                        RN.showWarning( 'Warning!', 'The customer has exceeded the special discount limit.');
                                    }

                                    totalDiscsToApply -= itemDisc;

                                    ModelService.get('Item', {sid: el.sid, document_sid: docSid, cols: '*'}).then((tempItems) => {
                                        var tempItem = tempItems[0];

                                        checkIfAnyPromoDiscountExisted(tempItem).then(discount => {

                                            tempItem.manual_disc_reason = $scope.discountType;
                                            tempItem.manual_disc_type = 2;

                                            if (discount) {
                                                if (itemDisc > discount.new_disc_amt) {
                                                    tempItem.manual_disc_value = itemDisc;
                                                    if (config_special_discount_process_type == 'pharma' || config_special_discount_process_type == 'default') {
                                                        tempItem.save().then(() => {
                                                            if (itemsLen == i) {
                                                                resolve(true);
                                                            } else {
                                                                next();
                                                            }
                                                        });
                                                    } else {
                                                        if (itemsLen == i) {
                                                            resolve(true);
                                                        } else {
                                                            next();
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (config_special_discount_process_type == 'pharma' || config_special_discount_process_type == 'default') {
                                                    tempItem.manual_disc_value = itemDisc;
                                                    tempItem.save().then(() => {
                                                        if (itemsLen == i) {
                                                            resolve(true);
                                                        } else {
                                                            next();
                                                        }
                                                    });
                                                } else {
                                                    if (itemsLen == i) {
                                                        resolve(true);
                                                    } else {
                                                        next();
                                                    }
                                                }
                                            }

                                        });
                                    });
                                } else if (invn.dcs_code.replace(/ /g,'') == 'SP' || invn.dcs_code.replace(/ /g,'') == 'SCPWDSP' || invn.dcs_code.replace(/ /g,'') == 'NACSP' || invn.dcs_code.replace(/ /g,'') == 'BIR') {
                                    if (el.price_before_detax) {
                                        var itemDisc = (el.price_before_detax * ($scope.discountPerc / 100) * el.quantity);
                                    } else {
                                        var itemDisc = (el.price * ($scope.discountPerc / 100) * el.quantity);
                                    }
                                    // console.log(el, itemDisc, totalDiscsToApply);
                                    if (itemDisc > totalDiscsToApply && $scope.discountLimit > 0) {
                                        itemDisc = (totalDiscsToApply * 1.12);
                                        RN.showWarning( 'Warning!', 'The customer has exceeded the special discount limit.');
                                    }
                                    totalDiscsToApply -= itemDisc;

                                    ModelService.get('Item', {sid: el.sid, document_sid: docSid}).then((tempItems) => {
                                        var tempItem = tempItems[0];
                                        
                                        checkIfAnyPromoDiscountExisted(tempItem).then(discount => {

                                            tempItem.manual_disc_reason = $scope.discountType;
                                            tempItem.manual_disc_type = 2;

                                            if (discount) {
                                                if (itemDisc > discount.new_disc_amt) {
                                                    tempItem.manual_disc_value = itemDisc;
                                                    tempItem.save().then(() => {
                                                        if (itemsLen == i) {
                                                            resolve(true);
                                                        } else {
                                                            next();
                                                        }
                                                    });
                                                }
                                            } else {
                                                tempItem.manual_disc_value = itemDisc;
                                                tempItem.save().then(() => {
                                                    if (itemsLen == i) {
                                                        resolve(true);
                                                    } else {
                                                        next();
                                                    }
                                                });
                                            }

                                        });
                                    });
                                } else {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
                                    }
                                }
                            } else {
                                if (invn.dcs_code.replace(/ /g,'') == 'ALL' || invn.dcs_code.replace(/ /g,'') == 'NAC' || invn.dcs_code.replace(/ /g,'') == 'NACSP' || invn.dcs_code.replace(/ /g,'') == 'SCPWDNAC' || invn.dcs_code.replace(/ /g,'') == 'BIR') {

                                    var itemDisc = ((el.price - el.tax_amount - el.tax2_amount) * ($scope.discountPerc / 100) * el.quantity);
                                    if (itemDisc > totalDiscsToApply && $scope.discountLimit > 0) {
                                        itemDisc = totalDiscsToApply;
                                        RN.showWarning( 'Warning!', 'The customer has exceeded the special discount limit.');
                                    }
                                    totalDiscsToApply -= itemDisc;

                                    ModelService.get('Item', {sid: el.sid, document_sid: docSid}).then((tempItems) => {
                                        var tempItem = tempItems[0];
                                        
                                        checkIfAnyPromoDiscountExisted(tempItem).then(discount => {

                                            tempItem.manual_disc_reason = $scope.discountType;
                                            tempItem.manual_disc_type = 2;

                                            if (discount) {
                                                if (itemDisc > discount.new_disc_amt) {
                                                    tempItem.manual_disc_value = itemDisc;
                                                    tempItem.save().then(() => {
                                                        if (itemsLen == i) {
                                                            resolve(true);
                                                        } else {
                                                            next();
                                                        }
                                                    });
                                                }
                                            } else {
                                                tempItem.manual_disc_value = itemDisc;
                                                tempItem.save().then(() => {
                                                    if (itemsLen == i) {
                                                        resolve(true);
                                                    } else {
                                                        next();
                                                    }
                                                });
                                            }

                                        });
                                    });
                                } else {
                                    if (itemsLen == i) {
                                        resolve(true);
                                    } else {
                                        next();
                                    }
                                }
                            }
                        });
                    }, () => {
                        if (itemsLen == i) {
                            resolve(true)
                        } else {
                            next();
                        }
                    });
                });
            });
        });
    }

    function setDefaultFields(doc, $http) {
        var discountType = sessionStorage.getItem('discountType');
        var discountPerc = sessionStorage.getItem('discountPerc');
        var discountLimit = sessionStorage.getItem('discountLimit');
        var guestCount = sessionStorage.getItem('guestCount');
        var guestCountSCPWD = sessionStorage.getItem('guestCountSCPWD');
        var SCPWDGuests = sessionStorage.getItem('SCPWDGuests');
        var guestNames = sessionStorage.getItem('guestNames');
        var guestTins = sessionStorage.getItem('guestTins');
        var guestIds = sessionStorage.getItem('guestIds');

        if (discountType && discountType != null && discountType != '') {
            $scope.discountType = discountType;
        }
        if (discountPerc && discountPerc != null && discountPerc != '') {
            $scope.discountPerc = parseInt(discountPerc);
        }
        if (discountLimit && discountLimit != null && discountLimit != '') {
            $scope.discountLimit = parseFloat(discountLimit);
        }
        if (guestCount && guestCount != null && guestCount != '') {
            $scope.guestCount = parseInt(guestCount);
        }
        if (guestCountSCPWD && guestCountSCPWD != null && guestCountSCPWD != '') {
            $scope.guestCountSCPWD = parseInt(guestCountSCPWD);
        }
        if (SCPWDGuests && SCPWDGuests != null && SCPWDGuests != '') {
            $scope.SCPWDGuests = SCPWDGuests.split(',');
        }
        if (guestNames && guestNames != null && guestNames != '') {
            $scope.guestNames = guestNames.split(',');
        }
        if (guestTins && guestTins != null && guestTins != '') {
            $scope.guestTins = guestTins.split(',');
        }
        if (guestIds && guestIds != null && guestIds != '') {
            $scope.guestIds = guestIds.split(',');
        }
    }

    $scope.modify = function(){
        sessionStorage.setItem('discountType', $scope.discountType);
        sessionStorage.setItem('discountPerc', $scope.discountPerc);
        sessionStorage.setItem('discountLimit', $scope.discountLimit);
        sessionStorage.setItem('guestCount', $scope.guestCount);
        sessionStorage.setItem('guestCountSCPWD', $scope.guestCountSCPWD);
        sessionStorage.setItem('SCPWDGuests', $scope.SCPWDGuests);
        sessionStorage.setItem('guestNames', $scope.guestNames);
        sessionStorage.setItem('guestTins', $scope.guestTins);
        sessionStorage.setItem('guestIds', $scope.guestIds);

        RN.showSuccessfulMessage('Success', 'Success on saving special discount.');

        $scope.closeModal();
    }   

    function modifyCallback() {
        var docSid = $stateParams.document_sid;

        ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {

            var doc = documents[0];
            if ($scope.discountType != 'ATHLETE') {
                doc.detax_flag = true;
            }
            doc.udf_float1 = $scope.guestCount
            doc.udf_float2 = $scope.guestCountSCPWD;
            var guestNames = null;
            var guestTins = null;
            var guestIds = null;

            if ($scope.guestCountSCPWD) {
                guestNames = $scope.guestNames.join(",");
                guestTins = $scope.guestTins.join(",");
                guestIds = $scope.guestIds.join(",");
            }

            doc.udf_string1 = guestNames;
            doc.udf_string2 = guestTins;
            doc.udf_string3 = guestIds;
            doc.udf_string4 = $scope.discountType;

            doc.save().then(() => {

                sessionStorage.setItem('discountType', $scope.discountType);
                sessionStorage.setItem('discountPerc', $scope.discountPerc);
                sessionStorage.setItem('discountLimit', $scope.discountLimit);
                sessionStorage.setItem('guestCount', $scope.guestCount);
                sessionStorage.setItem('guestCountSCPWD', $scope.guestCountSCPWD);
                sessionStorage.setItem('SCPWDGuests', $scope.SCPWDGuests);
                sessionStorage.setItem('guestNames', $scope.guestNames);
                sessionStorage.setItem('guestTins', $scope.guestTins);
                sessionStorage.setItem('guestIds', $scope.guestIds);

                $scope.closeModal();

            });

        });
        
    }

    $scope.apply = function(){

        if ($scope.discountType != '') {

            var docSid = $stateParams.document_sid;

            LoadingScreen.Enable = 1;

            ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                var doc = documents[0];

                var today = moment();
                var diff = today.subtract(7, 'days');
                    diff = diff.format("YYYY-MM-DDTHH:mm");

                ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                    
                    if ($scope.discountLimit) {

                         getPrevDocsSpecialDiscountsTotal(diff, doc).then((totalPrevDisc) => {
                            console.log(totalPrevDisc);
                            if (totalPrevDisc >= $scope.discountLimit) {
                                RN.showError('Error', 'Unable to apply discount. The customer has exceeded the special discount limit.');
                            } else {

                                var remaining = $scope.discountLimit - totalPrevDisc;

                                if (remaining <= 0.25) {
                                    RN.showError('Error', 'Unable to apply discount. The customer has exceeded the special discount limit.');
                                } else {
                                
                                    getItemsSpecialDiscountsEstimation(items).then((est) => {

                                        var totalDiscsToApply = est.est;
                                        if (est.est > remaining) {
                                            totalDiscsToApply = remaining;
                                        }

                                        
                                        if (config_special_discount_process_type == 'restaurant') {
                                            if ($scope.guestCount) {
                                                doc.manual_disc_reason = $scope.discountType;
                                                doc.manual_disc_type = 2;
                                                doc.manual_disc_value = (((doc.transaction_total_amt/$scope.guestCount)*$scope.guestCountSCPWD)/1.12) * ($scope.discountPerc / 100);

                                                doc.save().then(() => {
                                                    LoadingScreen.Enable = 0;

                                                    modifyCallback();

                                                    setTimeout(() => {
                                                        $state.go($state.current, {}, {reload: true});
                                                    }, 1000);
                                                    $scope.closeModal();
                                                });

                                                RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                            } else {
                                                LoadingScreen.Enable = 0;
                                                RN.showWarning('Warning', 'No special discount applied. No. of guest count is required.');
                                            }
                                        } else {
                                            applyItemsDiscount(totalDiscsToApply, est.totalQty).then(() => {
                                                RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');

                                                LoadingScreen.Enable = 0;

                                                modifyCallback();

                                                setTimeout(() => {
                                                    $state.go($state.current, {}, {reload: true});
                                                }, 1000);
                                                $scope.closeModal();
                                            });
                                        }
                                    });
                                }
                            }
                        });
                        
                    } else {
                        getItemsSpecialDiscountsEstimation(items).then((est) => {

                            var totalDiscsToApply = est.est;

                            
                            if (config_special_discount_process_type == 'restaurant') {
                                if ($scope.guestCount) {
                                    console.log(doc);

                                    doc.manual_disc_reason = $scope.discountType;
                                    doc.manual_disc_type = 2;
                                    doc.manual_disc_value = (((doc.transaction_total_amt/$scope.guestCount)*$scope.guestCountSCPWD)/1.12) * ($scope.discountPerc / 100);

                                    doc.udf_float01 = $scope.guestCount
                                    doc.udf_float02 = $scope.guestCountSCPWD;
                                    doc.udf_string01 = $scope.guestNames.join(",");
                                    doc.udf_string02 = $scope.guestTins.join(",");
                                    doc.udf_string03 = $scope.guestIds.join(",");

                                    doc.save().then(() => {
                                        LoadingScreen.Enable = 0;

                                        modifyCallback();

                                        setTimeout(() => {
                                            $state.go($state.current, {}, {reload: true});
                                        }, 1000);
                                        $scope.closeModal();
                                    });

                                    RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                } else {
                                    LoadingScreen.Enable = 0;
                                    RN.showWarning('Warning', 'No special discount applied. No. of guest count is required.');
                                }
                            } else {

                                applyItemsDiscount(totalDiscsToApply, est.totalQty).then(() => {
                                    // doc.udf_float01 = $scope.guestCount
                                    // doc.udf_float02 = $scope.guestCountSCPWD;
                                    // doc.udf_string01 = $scope.guestNames.join(",");
                                    // doc.udf_string02 = $scope.guestTins.join(",");
                                    // doc.udf_string03 = $scope.guestIds.join(",");

                                    // doc.save().then(() => {
                                        LoadingScreen.Enable = 0;

                                        modifyCallback();

                                        setTimeout(() => {
                                            $state.go($state.current, {}, {reload: true});
                                        }, 1000);
                                        $scope.closeModal();
                                    // });

                                    RN.showSuccessfulMessage('Success', 'Success on applying '+ $scope.discountType+' special discount.');
                                });
                            }
                                
                        });
                    }
                });
            });

        } else {
            RN.showError('Error', 'Please select a discount type first.');
            LoadingScreen.Enable = 0;
        }
    };
}];

window.angular.module('specialDiscountModalCtrl', []).controller('specialDiscountModalCtrl', specialDiscountModalCtrl);
