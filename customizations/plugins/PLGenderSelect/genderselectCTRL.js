$("#TransactionDetailsButton").click(function(){
    alert();
});

var genderselectCTRL = ["$scope","$interval", "$rootScope", "$http", "prismSessionInfo", "Preferences", "$uibModal", "NotificationService", "LoadingScreen", "ResourceNotificationService", "$window", "$state",
    function ($scope, $interval, $rootScope, $http, prismSessionInfo, Preferences, $uibModal, NotificationService, LoadingScreen, RS, $window, $state) {
        'use strict';
        let originalGender = null;
        $scope.showGenderDiv = true;
        $scope.genders = [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' }
        ];
        // alert($scope.showGenderDiv);
        $scope.flagName = "";
        var currentUrl = window.location.href;
        currentUrl = currentUrl.replace(/(#searchTransactionItemsResult0|\/new\/tender)/g, '');
        var uris = currentUrl.split('/');
        var docrowversion = "";
        var posFlag = "";
        // var match = currentUrl.match(/\/inventory\/item\/edit\/\d+\/\d+\/(\d+)/);
        // var sid = match[1];

        var session = JSON.parse(sessionStorage.getItem('session'));
        var sbssid = session.subsidiarysid;
        var workstationid = session.workstationid;
        var store_uid = session.storesid;
        var employeesid = session.employeesid;
        var authsession = session.token;
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

        // $http.get('v1/rest/posflag?cols=sid,row_version,required,flag_no,name,option.sid,option.doc_pos_flag_sid,option.flag_option,option.is_active,option.flag_id&filter=(subsidiary_sid,eq,'+sbssid+')').then((data) => {
        //     console.log(data.data[1]);
        //     // docrowversion = data.data[0].row_version;
            
        // });

        $http.get('v1/rest/posflag?cols=sid,row_version,required,flag_no,name,option.sid,option.doc_pos_flag_sid,option.flag_option,option.is_active,option.flag_id&filter=(subsidiary_sid,eq,'+sbssid+')')
        .then((response) => {
            const posFlags = response.data;
            const genderFlag = posFlags.find(flag => flag.flag_no === 2 && Array.isArray(flag.options));
            
            if (genderFlag) {
                $scope.flagName = genderFlag.name;
                $scope.genders = genderFlag.options
                    .filter(opt => opt.is_active) // Only include active options
                    .map(opt => ({
                        value: opt.flag_option,
                        label: opt.flag_option
                    }));
            } else {
                //console.warn('Gender Option not found in posflag data.');
                $scope.genders = [];
            }
        });
        

        $http.get('v1/rest/document/'+docno+'?cols=*').then((data) => {
            //console.log(data.data[0]);
            docrowversion = data.data[0].row_version;
            posFlag = data.data[0].pos_flag2;
            // if (posFlag === "Male" || posFlag === "Female") {
                $scope.selectedGender = posFlag;
                originalGender = posFlag; // Save the original for comparison
            // }
            // alert(docrowversion);
                if (data.data[0].status === 4) {
                    $scope.showGenderDiv = false;
                } else {
                    $scope.showGenderDiv = true;
                }
        });

        var isFetchingData = false; // Flag to control data fetch timing

        function fetchData() {
            if (isFetchingData) return; // Skip fetching if currently processing

            $.ajax({
              url: 'v1/rest/document/' + docno + '?cols=pos_flag2',
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, version=2',
                'Auth-Session': authsession,
              },
              success: function(response) {
                posFlag = response[0].pos_flag2;
                // if (posFlag === "Male" || posFlag === "Female") {
                    $scope.selectedGender = posFlag;
                    originalGender = posFlag; // Save the original for comparison
                    //console.log($scope.selectedGender);
                // }
              },
              error: function(error) {
                // Handle errors here
              }
            });
        }
          
          // Repeat the AJAX request every 1 second (1000ms)
        // setInterval(fetchData, 1000);
    

        $scope.onSelectChange = function() {

            if ($scope.selectedGender === originalGender) {
                //console.log('Gender not changed, skipping update.');
                return; // Don't do anything if it's the same as the original
            }
          //console.log('Selected gender:', $scope.selectedGender);
          LoadingScreen.Enable = 1;
          isFetchingData = true;
          var payload = '[{"pos_flag1":"","pos_flag2":"'+$scope.selectedGender+'","pos_flag3":"","ship_method_sid":null,"order_ship_method_sid":null,"manual_disc_reason":null,"manual_order_disc_reason":null}]';
            $http.get('v1/rest/document/'+docno+'?cols=*').then((data) => {
                //console.log(data.data[0]);
                docrowversion = data.data[0].row_version;
                $http.put('v1/rest/document/'+docno+'?filter=row_version,eq,'+docrowversion, payload)
                .then(function(response) {
                    LoadingScreen.Enable = 0;
                    originalGender = $scope.selectedGender; // Update the reference to the new value
                    //console.log('API Response for ALU:', response.data);
                    docrowversion = response.data[0].row_version;
                    $state.go($state.current, {}, {reload: true});

                    setTimeout(function() {
                        isFetchingData = false;
                    }, 2000);
                })
                .catch(function(error) {
                    LoadingScreen.Enable = 0;
                    setTimeout(function() {
                        isFetchingData = false;
                    }, 2000);
                });
            });
        };
    }
];


window.angular.module('genderselectCTRL', [])
    .controller('genderselectCTRL', genderselectCTRL);