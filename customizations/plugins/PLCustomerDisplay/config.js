var customerDisplayHandler = ['ModelEvent', 'ModelService', '$window', '$http', '$timeout', 'DocumentPersistedData', '$stateParams', 'ResourceNotificationService', function(ModelEvent, ModelService, $window, $http, $timeout, DocumentPersistedData, $stateParams, RN) {
    var handlerAfter = function($q, doc) {
            var deferred = $q.defer();
            var activeDocumentSid = $stateParams.document_sid;

            // if (typeof ModelService.fromCache('Document') === 'undefined') {
            //     activeDocumentSid = $stateParams.document_sid;
            // } else {
            //     activeDocumentSid = DocumentPersistedData.DocumentInformation.Sid;
            // }

            var serverName = $window.location.origin;
            ModelService.get('Document', {
                sid: activeDocumentSid, cols: '*'
            }).then(function(doc_result) {
                console.log(doc_result);
                if (doc_result[0].status != 2 && doc_result[0].status != 4) {
                    var item = [];
                    var fee = {
                        'fee_name': doc_result[0].fee_name1,
                        'fee_amount': doc_result[0].fee_amt1,
                        'record_flag': 2
                    };
                    var shipping = {
                        'shipping_method': doc_result[0].ship_method,
                        'shipping_amt': doc_result[0].shipping_amt,
                        'record_flag': 2
                    };
                    var discount = {
                        'disc_amt': doc_result[0].total_discount_amt,
                        'record_flag': 3
                    };
                    var total = {
                        'total_amt': doc_result[0].transaction_total_amt,
                        'subtotal_amt': doc_result[0].transaction_subtotal,
                        'record_flag': 4,
                        'lty_redeem_amt': doc_result[0].lty_redeem_amt
                    };
                    var tender = {
                        'tender_name': doc_result[0].tender_name,
                        'taken_amt': doc_result[0].taken_amt,
                        'given_amt': doc_result[0].given_amt,
                        'record_flag': 5
                    };

                    ModelService.get('Item', {
                        document_sid: activeDocumentSid, cols: 'sid,row_version,origin_application,document_sid,shipping_amt,invn_sbs_item_sid,item_description1,quantity,original_price,price,alu,discount_amt,kit_flag'
                    }).then(function(item_result) {

                        console.log(item_result);
                        angular.forEach(item_result, function(value) {
                            var per_item = {};
                            var shipping_amt = (value.shipping_amt != '' && value.shipping_amt != null) ? value.shipping_amt : 0;
                            per_item['item_sid'] = value.invn_sbs_item_sid;
                            per_item['item_desc'] = value.item_description1;
                            per_item['item_qty'] = value.quantity;
                            per_item['item_price'] = value.original_price;
                            per_item['item_ext_price'] = parseFloat(parseFloat(value.quantity) * parseFloat(value.price)) + parseFloat(shipping_amt);
                            per_item['item_alu'] = value.alu;
                            per_item['record_flag'] = 0;
                            per_item['item_discount_amt'] = value.discount_amt;
                            per_item['item_kit_flag'] = value.kit_flag;
                            item.push(per_item);
                        });
                        $http.post(serverName + '/plugins/PLCustomerDisplay/executeCustDisplay.php', {
                            'cd_packaged_item_display': cd_packaged_item_display,
                            'item': item,
                            'fee': fee,
                            'shipping': shipping,
                            'discount': discount,
                            'total': total,
                            'tender': tender,
                            'employee1_name': doc_result[0].employee1_name,
                            'workstation_number': doc_result[0].workstation_number,
                            'serverName':serverName
                        }).then(function(result) {

                        });
                    });
                } else if (doc_result[0].status == 4) {
                    var item = [];
                    var fee = {
                        'fee_name': doc_result[0].fee_name1,
                        'fee_amount': doc_result[0].fee_amt1,
                        'record_flag': 2
                    };
                    var shipping = {
                        'shipping_method': doc_result[0].ship_method,
                        'shipping_amt': doc_result[0].shipping_amt,
                        'record_flag': 2
                    };
                    var discount = {
                        'disc_amt': doc_result[0].total_discount_amt,
                        'record_flag': 3
                    };
                    var total = {
                        'total_amt': doc_result[0].transaction_total_amt,
                        'subtotal_amt': doc_result[0].transaction_subtotal,
                        'record_flag': 4,
                        'lty_redeem_amt': doc_result[0].lty_redeem_amt
                    };
                    var tender = {
                        'tender_name': doc_result[0].tender_name,
                        'taken_amt': doc_result[0].taken_amt,
                        'given_amt': doc_result[0].given_amt,
                        'record_flag': 5
                    };

                    ModelService.get('Item', {
                        document_sid: activeDocumentSid, cols: 'sid,row_version,origin_application,document_sid,shipping_amt,invn_sbs_item_sid,item_description1,quantity,original_price,price,alu,discount_amt,kit_flag'
                    }).then(function(item_result) {
                        angular.forEach(item_result, function(value) {
                            var per_item = {};
                            var shipping_amt = (value.shipping_amt != '' && value.shipping_amt != null) ? value.shipping_amt : 0;
                            per_item['item_sid'] = value.invn_sbs_item_sid;
                            per_item['item_desc'] = value.item_description1;
                            per_item['item_qty'] = value.quantity;
                            per_item['item_price'] = value.original_price;
                            per_item['item_ext_price'] = parseFloat(parseFloat(value.quantity) * parseFloat(value.price)) + parseFloat(shipping_amt);
                            per_item['item_alu'] = value.alu;
                            per_item['record_flag'] = 0;
                            per_item['item_discount_amt'] = value.discount_amt;
                            per_item['item_kit_flag'] = value.kit_flag;
                            item.push(per_item);
                        });

                        $http.post(serverName + '/plugins/PLCustomerDisplay/executeCustDisplay.php', {
                            'cd_packaged_item_display': cd_packaged_item_display,
                            'item': item,
                            'fee': fee,
                            'shipping': shipping,
                            'discount': discount,
                            'total': total,
                            'tender': tender,
                            'employee1_name': doc_result[0].employee1_name,
                            'workstation_number': doc_result[0].workstation_number,
                            'serverName':serverName
                        }).then(function(result) {});
                    });

                } else {
                    var item = [];
                    var fee = {
                        'fee_name': '',
                        'fee_amount': 0,
                        'record_flag': 2
                    };
                    var shipping = {
                        'shipping_method': '',
                        'shipping_amt': 0,
                        'record_flag': 2
                    };
                    var discount = {
                        'disc_amt': 0,
                        'record_flag': 3
                    };
                    var total = {
                        'total_amt': 0,
                        'subtotal_amt': 0,
                        'record_flag': 4,
                        'lty_redeem_amt': 0
                    };
                    var tender = {
                        'tender_name': '',
                        'taken_amt': 0,
                        'given_amt': 0,
                        'record_flag': 5
                    };

                    $http.post(serverName + '/plugins/PLCustomerDisplay/executeCustDisplay.php', {
                        'cd_packaged_item_display': cd_packaged_item_display,
                        'item': item,
                        'fee': fee,
                        'shipping': shipping,
                        'discount': discount,
                        'total': total,
                        'tender': tender,
                        'employee1_name': doc_result[0].employee1_name,
                        'workstation_number': doc_result[0].workstation_number,
                            'serverName':serverName
                    }).then(function(result) {});
                }

            });

            deferred.resolve();
            //return the deferred promise
            return deferred.promise;
        };


    var handlerAfterDocInsert = function($q, doc) {
            var deferred = $q.defer();
            var activeDocumentSid = doc.sid;
            if (sessionStorage.getItem('hasCustomer') !== null) {
                sessionStorage.removeItem('hasCustomer');
            }
            if (sessionStorage.getItem('gcItem') !== null) {
                sessionStorage.removeItem('gcItem');
            }

            // if(typeof ModelService.fromCache('Document') === 'undefined')
            // {
            //     activeDocumentSid = $stateParams.document_sid;
            // }
            // else
            // {
            //     activeDocumentSid = ModelService.fromCache('Document')[0].sid;
            // }
            var serverName = $window.location.origin;
            var item = [];
            var fee = {
                'fee_name': '',
                'fee_amount': 0,
                'record_flag': 2
            };
            var shipping = {
                'shipping_method': '',
                'shipping_amt': 0,
                'record_flag': 2
            };
            var discount = {
                'disc_amt': 0,
                'record_flag': 3
            };
            var total = {
                'total_amt': 0,
                'subtotal_amt': 0,
                'record_flag': 4,
                'lty_redeem_amt': 0
            };
            var tender = {
                'tender_name': '',
                'taken_amt': 0,
                'given_amt': 0,
                'record_flag': 5
            };

            $http.post(serverName + '/plugins/PLCustomerDisplay/executeCustDisplay.php', {
                'cd_packaged_item_display': cd_packaged_item_display,
                'item': item,
                'fee': fee,
                'shipping': shipping,
                'discount': discount,
                'total': total,
                'tender': tender,
                'employee1_name': doc.employee1_name,
                'workstation_number': doc.workstation_number,
                            'serverName':serverName
            }).then(function(result) {});

            //resolve the deferred operation
            deferred.resolve();

            //return the deferred promise
            return deferred.promise;
        };

    ModelEvent.addListener('item', ['onAfterSave', 'onAfterInsert', 'onAfterRemove'], handlerAfter);
    ModelEvent.addListener('document', ['onAfterSave', 'onAfterRemove'], handlerAfter);
    ModelEvent.addListener('document', ['onAfterInsert'], handlerAfterDocInsert);
    ModelEvent.addListener('tender', ['onAfterSave', 'onAfterInsert', 'onAfterRemove'], handlerAfter);
    ModelEvent.addListener('discount', ['onAfterSave', 'onAfterInsert', 'onAfterRemove'], handlerAfter);
}]

ConfigurationManager.addHandler(customerDisplayHandler);

ButtonHooksManager.addHandler(['after_useLtyPointsApply'], ['$q', 'ModelService', '$window', '$http', '$timeout', '$stateParams', function($q, ModelService, $window, $http, $timeout, $stateParams) {
    var deferred = $q.defer();
    
    $timeout(function() {
        var activeDocumentSid = $stateParams.document_sid;

        ModelService.get('Document', {
            sid: activeDocumentSid, cols: 'sid,row_version,origin_application,status,fee_name1,fee_amt1,ship_method,shipping_method,shipping_amt,total_discount_amt,transaction_total_amt,tender_name,taken_amt,given_amt,transaction_subtotal'
        }).then(function(doc_result) {
            var doc = doc_result[0];
            doc.save(() => {
                $state.go($state.current, {}, {reload: true});
            });
        });

        deferred.resolve();
        //return the deferred promise
        return deferred.promise;
    }, 1000);
}]);


ButtonHooksManager.addHandler(['after_posShowDiscountRemove'], ['$q', 'ModelService', '$window', '$http', '$timeout', '$stateParams', function($q, ModelService, $window, $http, $timeout, $stateParams) {
    var deferred = $q.defer();

    $timeout(function() {
        var activeDocumentSid = $stateParams.document_sid;
        // if (typeof ModelService.fromCache('Document') === 'undefined') {
        //     activeDocumentSid = $stateParams.document_sid;
        // } else {
        //     activeDocumentSid = ModelService.fromCache('Document')[0].sid;
        // }

        var serverName = $window.location.origin;

        ModelService.get('Document', {
            sid: activeDocumentSid, cols: 'sid,row_version,origin_application,status,fee_name1,fee_amt1,ship_method,shipping_method,shipping_amt,total_discount_amt,transaction_total_amt,tender_name,taken_amt,given_amt,transaction_subtotal'
        }).then(function(doc_result) {

            var item = [];
            var fee = {
                'fee_name': doc_result[0].fee_name1,
                'fee_amount': doc_result[0].fee_amt1,
                'record_flag': 2
            };
            var shipping = {
                'shipping_method': doc_result[0].ship_method,
                'shipping_amt': doc_result[0].shipping_amt,
                'record_flag': 2
            };
            var discount = {
                'disc_amt': doc_result[0].total_discount_amt,
                'record_flag': 3
            };
            var total = {
                'total_amt': doc_result[0].transaction_total_amt,
                'subtotal_amt': doc_result[0].transaction_subtotal,
                'record_flag': 4,
                'lty_redeem_amt': doc_result[0].lty_redeem_amt
            };
            var tender = {
                'tender_name': doc_result[0].tender_name,
                'taken_amt': doc_result[0].taken_amt,
                'given_amt': doc_result[0].given_amt,
                'record_flag': 5
            };

            ModelService.get('Item', {
                document_sid: activeDocumentSid, cols: 'sid,row_version,origin_application,document_sid,shipping_amt,invn_sbs_item_sid,item_description1,quantity,original_price,price,alu,discount_amt,kit_flag'
            }).then(function(item_result) {
                angular.forEach(item_result, function(value) {
                    var per_item = {};
                    var shipping_amt = (value.shipping_amt != '' && value.shipping_amt != null) ? value.shipping_amt : 0;
                    per_item['item_sid'] = value.invn_sbs_item_sid;
                    per_item['item_desc'] = value.item_description1;
                    per_item['item_qty'] = value.quantity;
                    per_item['item_price'] = value.original_price;
                    per_item['item_ext_price'] = parseFloat(parseFloat(value.quantity) * parseFloat(value.price)) + parseFloat(shipping_amt);
                    per_item['item_alu'] = value.alu;
                    per_item['record_flag'] = 0;
                    per_item['item_discount_amt'] = value.discount_amt;
                    per_item['item_kit_flag'] = value.kit_flag;
                    item.push(per_item);
                });

                $http.post(serverName + '/plugins/PLCustomerDisplay/executeCustDisplay.php', {
                    'cd_packaged_item_display': cd_packaged_item_display,
                    'item': item,
                    'fee': fee,
                    'shipping': shipping,
                    'discount': discount,
                    'total': total,
                    'tender': tender,
                    'employee1_name': doc_result[0].employee1_name,
                    'workstation_number': doc_result[0].workstation_number,
                            'serverName':serverName
                }).then(function(result) {

                });
            });
        });

        //resolve the deferred operation
        deferred.resolve();
        //return the deferred promise
        return deferred.promise;
    }, 1000);

}]);
