var PL1PriceCTRL = ["$scope", "$rootScope", "$http", "prismSessionInfo", "Preferences", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "$state",
    function ($scope, $rootScope, $http, prismSessionInfo, Preferences, $uibModal, NotificationService, LoadingScreen, RS, $window, $state) {
        'use strict';
        $scope.priceBySid = {};
       
        var currentUrl = window.location.href;
        currentUrl = currentUrl.replace(/(#searchTransactionItemsResult0|\/new\/tender)/g, '');
        var uris = currentUrl.split('/');
        var docrowversion = "";
        var posFlag = "";
        // var match = currentUrl.match(/\/inventory\/item\/edit\/\d+\/\d+\/(\d+)/);
        // var sid = match[1];
        var pricelevel1sid = "";
        var session = JSON.parse(sessionStorage.getItem('session'));
        var sbssid = session.subsidiarysid;
        var workstationid = session.workstationid;
        var store_uid = session.storesid;
        var employeesid = session.employeesid;
        var docno = ""; // Variable to hold the last string consisting only of numbers
        var foundNumber = false;

        // Iterate through the URL parts in reverse order
        for (var i = uris.length - 1; i >= 0; i--) {
            // Check if the current part is a string consisting only of numbers
            if (/^\d+$/.test(uris[i])) {
                docno = uris[i];
                foundNumber = true;
                break;
            }
        }

        
        

        // $http.get('v1/rest/document/'+docno+'?cols=*').then((data) => {
        //     console.log(data.data[0]);
            
        // });

        // $http.get('v1/rest/document/'+docno+'/item?cols=*&sort=enhanced_item_pos,desc').then((data) => {
        // });

        $scope.Pl1price = function(sid){
            $http.get('v1/rest/pricelevel/?filter=%28active%2Ceq%2Ctrue%29AND%28sbssid%2Ceq%2C'+sbssid+'%29AND%28price_level%2Ceq%2C1%29&cols=sid').then((data) => {
                //console.log(data.data[0]);
                pricelevel1sid = data.data[0].sid;
                $http.get('api/backoffice/inventory?filter=(sid,eq,'+sid+')&cols=sid,invnprice.*').then((data) => {
                    // console.log(data.data.data[0]);
                    var item = data.data.data[0];
                    //console.log(item);

                    var prices = item.invnprice || [];

                    // Find price where pricelvlsid matches
                    var match = prices.find(p => p.pricelvlsid === pricelevel1sid);

                    if (match) {
                        $scope.pricepl1 = match.price;
                    } else {
                        $scope.pricepl1 = 0;
                    }
                    
                    // alert(match.price);
                });
            });

        //filter%28price_level%2Ceq%2C1%29AND%28sid%2Ceq%2C722233898000190079%29%26cols%3D%2A
        }

        
    }
];


window.angular.module('PL1PriceCTRL', [])
    .controller('PL1PriceCTRL', PL1PriceCTRL);