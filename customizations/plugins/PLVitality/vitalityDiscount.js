var DiscountCtrl = ["$scope", "$rootScope","$http", "LoadingScreen", "NotificationService", "$stateParams", "ModelService", "ModelService2", "$state", "$uibModal",
    function($scope, $rootScope, $http, LoadingScreen, NotificationService, $stateParams, ModelService, ModelService2, $state, $uibModal) {
        'use strict';
        $scope.isDisabled = true;
        function checkURL() {
            return window.location.hash.includes("/new");
        }

        if (!sessionStorage.details) {
            console.log("No Vitality Customer");
            $scope.details2 = null;
        } else {
            try {
                var customer = JSON.parse(sessionStorage.details);
                if(checkURL()){
                    if (customer.eligibilityDetails[0].eligible == "true") {
                        $scope.details2 = customer;
                        document.getElementById("vitalityButton").disabled = true;
                    } else {
                        console.log("Invalid customer data structure");
                        $scope.details2 = null;
                    }
                }else{
                    sessionStorage.removeItem('sessionIndex');
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('details');
                }
            } catch (e) {
                console.error("Error parsing sessionStorage.details:", e);
                $scope.details2 = null;
            }
        }

        $scope.toggleIndex = function(index) {
            $scope.currentIndex = index;
            //console.log('Returned Index:',$scope.currentIndex);
            sessionStorage.setItem('sessionIndex', JSON.stringify($scope.currentIndex));
        };

        
                  
        $scope.discount = function(){
            LoadingScreen.Enable = 1;
            if(sessionStorage.sessionIndex == undefined){
                $scope.currentIndex = 0
                sessionStorage.setItem('sessionIndex', JSON.stringify($scope.currentIndex));
            }else{
                $scope.currentIndex = sessionStorage.sessionIndex;
            }
            var docSid = $stateParams.document_sid;
            if(sessionStorage.details === undefined){
                alert('No Member Verified.');
                $state.go($state.current, {}, {reload: true} );
            }else{
                ModelService.get('Pricelevel',{cols:'*'}).then(function(data){
                    var price_lvl = data.filter(item => item.price_level_name  === 'FPrice');
                    //const price_lvl1 = data.filter(item => item.price_level === 1);
                    ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                        var doc = documents[0];
                        var accountDetails = JSON.parse(sessionStorage.details);
                        var memberID = accountDetails.membershipNum;
                        doc.tracking_number = "Philam Vitality";
                        doc.notes_general = memberID;
                        doc.save().then(() => {});
                        ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                            var item = items[$scope.currentIndex];
                            ModelService.get('Inventory', { sid: item.invn_sbs_item_sid}).then((invns) => {
                                var invn = invns[0];
                                var sbs = invn.subsidiary_sid;
                                var sid = invn.sid;
                                var active = JSON.parse(sessionStorage.session);
                                var url = '/api/backoffice/inventory?action=InventoryGetItems&cols=*,invnextend,invnextend.*,invnprice.*,invnquantity.*,invnvendor.*,invnlty.*' + 
                                '&filter=(sid,eq,' + sid + ')AND(sbssid,eq,' + sbs + ')';
                                var data = {
                                    'data' :
                                    [
                                        {
                                        ActivePriceLevelSid: active.pricelevelsid,
                                        ActiveSeasonSid: active.seasonsid,
                                        ActiveStoreSid: active.storesid
                                        }
                                    ]
                                }
                                $http.post(url, data)
                                .then(function(response) {
                                    var data = response.data.data[0].invnprice;
                                    var srp = data.filter(item => item.pricelvlname === 'SRP');
                                    var fprice = data.filter(item => item.pricelvlname === 'FPrice');
                                    if(srp[0].price == fprice[0].price){
                                        ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                                            let realTimeBalance = 0;
                                            var qty = item.quantity;
                                            var item_details = srp[0];
                                            var accountDetails = JSON.parse(sessionStorage.details);
                                            var discountSubtracted = (accountDetails.eligibilityDetails[0].rate[0].discountRate / 100);
                                            var discountAmount = item_details.price * discountSubtracted;
                                            var latestCredit = accountDetails.eligibilityDetails[0].limits[0].amountRemaining;
                                            var updated_price = item_details.price - discountAmount;
                                            for (let i = 0; i < items.length; i++) {
                                                if(i == $scope.currentIndex){
                                                    realTimeBalance += updated_price * qty;
                                                }else{
                                                    realTimeBalance += items[i].original_price * items[i].quantity;
                                                }
                                            }
                                            if((accountDetails.eligibilityDetails[0].limits[0].amountRemaining - realTimeBalance) >= 0){
                                                item.note2 = discountAmount === 0 || discountAmount === '' ? 0 : discountAmount * qty;
                                                item.note3 = latestCredit;
                                                item.note4 = discountSubtracted;
                                                item.note5 = items[$scope.currentIndex].original_price;
                                                item.quantity = qty;
                                                item.original_price = updated_price;
                                                item.manual_disc_value = updated_price;
                                                item.manual_disc_type = 0;
                                                item.manual_disc_reason = "Philam Discount";
                                                item.save().then(() => {
                                                    ModelService.get('Document', {sid: doc.sid, cols: "*"}).then((documents) => {
                                                        var docs = documents[0];
                                                        var latestRowVersion = docs.row_version;
                                                        docs.udf_string1 = latestCredit - realTimeBalance;
                                                        docs.udf_string2 = accountDetails.memberPolicyEndDate;
                                                        docs.save().then(() => {
                                                            $state.go($state.current, {}, {reload: true} );
                                                        });
                                
                                                    });
                                                });
                                                
                                                $uibModal.open({
                                                    templateUrl: '/plugins/PLVitality/views/appliedDiscount.htm', 
                                                    controller: 'appliedDiscount',
                                                    size: 'md',
                                                    backdrop: 'static',
                                                    resolve: {
                                                        appliedDiscount: function() {
                                                            return {
                                                                item_details: item_details,
                                                                accountDetails: accountDetails,
                                                                discountSubtracted: discountSubtracted,
                                                                discountAmount: discountAmount,
                                                                qty: qty,
                                                                latestCredit: latestCredit,
                                                                updated_price: updated_price * qty,
                                                                updatedRemainingBalance: latestCredit - realTimeBalance,
                                                                realtimeDiscountAmount: realTimeBalance
                                                            };
                                                        }
                                                    }
                                                });
                                                
                                            }else{
                                                $state.go($state.current, {}, {reload: true} );
                                                $uibModal.open({
                                                    templateUrl: '/plugins/PLVitality/views/limitExceed.htm', 
                                                    controller: 'appliedDiscount',
                                                    size: 'md',
                                                    backdrop: 'static',
                                                    resolve: {
                                                        appliedDiscount: function() {
                                                            return {
                                                                item_details: item_details,
                                                                accountDetails: accountDetails,
                                                                discountSubtracted: discountSubtracted,
                                                                discountAmount: discountAmount,
                                                                qty: qty,
                                                                latestCredit: latestCredit,
                                                                updated_price: updated_price * qty,
                                                                updatedRemainingBalance: latestCredit - realTimeBalance,
                                                                realtimeDiscountAmount: realTimeBalance
                                                            };
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }else{
                                        var accountDetails = JSON.parse(sessionStorage.details);
                                        $state.go($state.current, {}, {reload: true} );
                                        $uibModal.open({
                                            templateUrl: '/plugins/PLVitality/views/NoDiscount.htm', 
                                            controller: 'noDiscount',
                                            size: 'md',
                                            backdrop: 'static',
                                            resolve: {
                                                noDiscount: function() {
                                                    return {
                                                        accountDetails: accountDetails
                                                    };
                                                }
                                            }
                                        });
                                    }
                                })
                                .catch(function(error) {
                                    console.error('Error fetching data:', error);
                                });
                            });
                        });
                    });
                });
            }
        }
    }
];
    
window.angular.module('DiscountCtrl', []).controller('DiscountCtrl', DiscountCtrl);

ButtonHooksManager.addHandler(['after_navPosTenderPrintUpdate', 'after_navPosTenderUpdateOnly'],
    function($q, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window) {
        var deferred = $q.defer();
        // Make an HTTP GET request to your PHP script, passing docSid as a parameter
        if (sessionStorage.details) {
            var docSid = $stateParams.document_sid;
            var firstModalInstance = $uibModal.open({
                templateUrl: '/plugins/PLVitality/views/sendingTransaction.htm', 
                controller: 'closeCtrl',
                size: 'md',
                backdrop: 'static',
            });

            $http.get('/plugins/PLVitality/data.php?doc_sid=' + docSid)
            .then(function(response) {
                if (response.data && response.data.length > 0) {
                    //console.log("Data retrieved:", response.data);
                    //NotificationService.success('Data successfully retrieved for Document SID: ' + docSid);
                    var hasStatus4 = false;

                    for (var i = 0; i < response.data.length; i++) {
                        if (response.data[i].status == 4) {
                            hasStatus4 = true;
                            break;
                        }
                    }
                    if(hasStatus4)
                    {
                        ModelService.get('Document', {sid: docSid, cols: "*"}).then((documents) => {
                            var docs = documents[0];
                            ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                                var data = items;
                                var accountDetails = JSON.parse(sessionStorage.details);
                                var memberID = accountDetails.membershipNum;
                                const filtered = data.filter(it => {
                                    return it.note2 !== undefined &&
                                        it.note2 !== null &&
                                        it.note2 !== ""  &&
                                        Number(it.note2) !== 0;
                                });
                                const transactions = [];
                                filtered.forEach(item => {
                                    var postData = {
                                        document_sid: docs.sid,
                                        document_item_sid: item.sid,
                                        type: docs.receipt_type === 0 ? "SALE" : "RETURN",
                                        numOfUsage: filtered.length,
                                        status: 0, 
                                        currency: "PHP", 
                                        fullFareAmount: item.price * item.quantity, 
                                        qualifyingAmount: item.price * item.quantity, 
                                        discountedAmount: item.price * item.quantity,
                                        additionalFees: item.additionalFees || "0", 
                                        cancellationFees: item.cancellationFees || "0",
                                        discountAmount: item.note2, 
                                        discountPercentage: item.note4, 
                                        amountEffectiveDate: response.data[i].Transaction_Date,//?.split("T")[0],
                                        lineReference: docs.document_number,
                                        lineDescription: item.item_description1,
                                        qualifyingTransaction: true,
                                        partnerSubCode: "TOBSPRT",
                                        sku: item.alu,
                                        uniqueProductRef: item.alu,
                                        productCategory: "OTHER",
                                        transactionDate: response.data[i].Transaction_Date,//.split("T")[0],
                                        memberfullName: accountDetails.memberInfo.fullName,
                                        memberIdentifierReference: memberID,
                                        memberIdentifierReferenceType: "MEMBERSHIPNO",
                                        partnerTransactionRef: docs.document_number,
                                        remarks: "Partner-Capture",
                                        numOfUsageItem: item.quantity
                                    };
                                    transactions.push(postData);
                                });

                                console.log(transactions);
                        
                                $http.post("/plugins/PLVitality/saveTransactionAIA.php", 
                                    { transactions: transactions }, 
                                    { headers: { 'Content-Type': 'application/json' } }
                                )
                                .then(function(response) {
                                    if (firstModalInstance) {
                                        firstModalInstance.close();
                                    }
                                    sessionStorage.removeItem('sessionIndex');
                                    sessionStorage.removeItem('accessToken');
                                    sessionStorage.removeItem('details');
                                    console.log("Response:", response.data);
                                    var ModalInstance = $uibModal.open({
                                        templateUrl: '/plugins/PLVitality/views/successfulTransaction.htm', 
                                        controller: 'closeCtrl',
                                        size: 'md',
                                        backdrop: 'static'
                                    });
                                    setTimeout(() => {
                                        ModalInstance.close();
                                    }, 30000);
                                })
                                .catch(function(error) {
                                    console.error("Error:", error);
                                });
                            });
                            // ModelService.get('Item', {document_sid: docSid, cols: "*"}).then((items) => {
                            //     var data = items;
                            //     var accountDetails = JSON.parse(sessionStorage.details);
                            //     var memberID = accountDetails.membershipNum;
                            //     const transactions = [];
                            //     data.forEach(item => {
                            //         var postData = {
                            //             document_sid: docs.sid,
                            //             document_item_sid: item.sid,
                            //             type: docs.receipt_type === 0 ? "SALE" : "RETURN",
                            //             numOfUsage: data.length,
                            //             status: 0, 
                            //             currency: "PHP", 
                            //             fullFareAmount: item.price * item.quantity, 
                            //             qualifyingAmount: item.price * item.quantity, 
                            //             discountedAmount: item.note2,
                            //             additionalFees: item.additionalFees || "0", 
                            //             cancellationFees: item.cancellationFees || "0",
                            //             discountAmount: item.note2, 
                            //             discountPercentage: item.note4, 
                            //             amountEffectiveDate: docs.invc_post_date,//?.split("T")[0],
                            //             lineReference: docs.document_number,
                            //             lineDescription: item.item_description1,
                            //             qualifyingTransaction: true,
                            //             partnerSubCode: "TOBSPRT",
                            //             sku: item.alu,
                            //             uniqueProductRef: item.alu,
                            //             productCategory: "OTHER",
                            //             transactionDate: docs.invc_post_date,//.split("T")[0],
                            //             memberfullName: accountDetails.memberInfo.fullName,
                            //             memberIdentifierReference: memberID,
                            //             memberIdentifierReferenceType: "MEMBERSHIPNO",
                            //             partnerTransactionRef: docs.document_number,
                            //             remarks: "Partner-Capture",
                            //         };
                            //         transactions.push(postData);
                            //     });

                            //     console.log(transactions);
                        
                            //     $http.post("/plugins/PLVitality/saveTransactionAIA.php", 
                            //         { transactions: transactions }, 
                            //         { headers: { 'Content-Type': 'application/json' } }
                            //     )
                            //     .then(function(response) {
                            //         if (firstModalInstance) {
                            //             firstModalInstance.close();
                            //         }
                            //         sessionStorage.removeItem('sessionIndex');
                            //         sessionStorage.removeItem('accessToken');
                            //         sessionStorage.removeItem('details');
                            //         console.log("Response:", response.data);
                            //         var ModalInstance = $uibModal.open({
                            //             templateUrl: '/plugins/PLVitality/views/successfulTransaction.htm', 
                            //             controller: 'closeCtrl',
                            //             size: 'md',
                            //             backdrop: 'static'
                            //         });
                            //         setTimeout(() => {
                            //             ModalInstance.close();
                            //         }, 30000);
                            //     })
                            //     .catch(function(error) {
                            //         console.error("Error:", error);
                            //     });
                            // });
                        });
                    }
                } else {
                    console.warn('No data found for Document SID:', docSid);
                }
                //deferred.resolve(response.data);
            }, function(error) {
                console.error('Error retrieving data:', error);
                deferred.reject(error);
            });
        }
        return deferred.promise;
    }
);