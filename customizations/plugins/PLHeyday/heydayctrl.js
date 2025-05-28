// jQuery(document).ready(function($) {
//     var on = true;
//     $(".ng-scope").on("click", function () {
//         if(on){
//             on = false;
//             // Check if the button has a child element with the class "ng-binding"
//             if ($(this).find(".ng-binding").length > 0) {
//                 // Your code here that should run when the condition is met
//                 var currentUrl = window.location.href;
//                 if (currentUrl.includes("/inventory/item/edit")) {
//                     var itemId = "";
//                     var match = currentUrl.match(/\/inventory\/item\/edit\/\d+\/\d+\/(\d+)/);

//                     // Check if a match is found
//                     if(match && match[1]) {
//                       // Return the extracted item ID
//                         itemId = match[1];
//                         $.ajax({
//                             url: 'plugins/PLHeyday/heyday.php',
//                             method: 'GET',
//                             data: { sid: itemId },
//                             success: function(data) {
//                                 var result = JSON.parse(data);
//                                 // alert(result.total);
//                                 setTimeout(function() {
//                                     // Code to be executed after the delay
//                                    $('.companyQTY').text("Company Qty:"+result.total);
//                                 }, 120);
                                
//                             }
//                         });
//                       // 
//                     }
                    
//                 }
//             } 
//             on = true;
//         }
//     });

//     var currentUrl = window.location.href;
//     if (currentUrl.includes("/inventory/item/edit")) {
//         var itemId = "";
//         var match = currentUrl.match(/\/inventory\/item\/edit\/\d+\/\d+\/(\d+)/);

//         // Check if a match is found
//         if(match && match[1]) {
//           // Return the extracted item ID
//             itemId = match[1];
//             $.ajax({
//                 url: 'plugins/PLHeyday/heyday.php',
//                 method: 'GET',
//                 data: { sid: itemId },
//                 success: function(data) {
//                     var result = JSON.parse(data);
//                     // alert(result.total);
//                     setTimeout(function() {
//                         // Code to be executed after the delay
//                        $('.companyQTY').text("Company Qty:"+result.total);
//                     }, 120);
                    
//                 }
//             });
//           // 
//         }
        
//     }
// });


var companyQTYCtrl = ["$scope", "$rootScope", "$http", "prismSessionInfo", "Preferences", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "$state",
    function ($scope, $rootScope, $http, prismSessionInfo, Preferences, $uibModal, NotificationService, LoadingScreen, RS, $window, $state) {
        'use strict';
        
        $scope.companyQTY = 0;

        var currentUrl = window.location.href;
        var uris = currentUrl.split('/');
        // var match = currentUrl.match(/\/inventory\/item\/edit\/\d+\/\d+\/(\d+)/);
        // var sid = match[1];

        var session = JSON.parse(sessionStorage.getItem('session'));
        var sbssid = session.subsidiarysid;
        // console.log(uris[uris.length - 1], sbssid)
        $http.get('api/backoffice/invnqtylist/?cols=*&filter=(sbssid,eq,'+sbssid+')AND(sid,eq,'+uris[uris.length - 1]+')&sort=storecode,asc').then((data) => {
            // console.log(data.data.data);
            if (data.data.data.length) {
                // console.log(data.data.data);
                for (var i = 0; i < data.data.data.length; i++) {
                    $scope.companyQTY += parseFloat(data.data.data[i].qty);
                }

            } else {
                $scope.companyQTY = 0;
            }

        });
    }
];


window.angular.module('companyQTYCtrl', [])
    .controller('companyQTYCtrl', companyQTYCtrl);