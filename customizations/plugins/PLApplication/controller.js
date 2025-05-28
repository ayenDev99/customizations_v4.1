prismApp.controller('applicationController', ["$scope", "$uibModal", "$timeout", "$window", function($scope, $uibModal, $timeout, $window) {
	
    if(!config_ApplicationEnabled){
		document.getElementById("applicationBtn").style.display = 'none';
	}

    if(checkURL("/inventory/item/view"))
    {
        $timeout(function() {
            document.getElementsByTagName("fieldset")[0].removeAttribute("disabled");

            var buttonCrtVndorElement = document.querySelector('button[event-name="openCreateVendorTool"]');
            if (buttonCrtVndorElement) {
                buttonCrtVndorElement.setAttribute("disabled", "true")
            } else {
                console.log('Button create vendor not found.');
            }

            var buttonCrtDprtmntElement = document.querySelector('button[event-name="openCreateDepartmentTool"]');
            if (buttonCrtDprtmntElement) {
                buttonCrtDprtmntElement.setAttribute("disabled", "true")
            } else {
                console.log('Button create deparment not found.');
            }
           
        }, 1000);
    }

    // var buttoninvnEditMiscElement = document.querySelector('button[event-name="invnEditMiscTab"]');
    // buttoninvnEditMiscElement.setAttribute('ng-click', 'handleButtonClick(); splitUi.setTab($index.toString(), \'right\')');
	// if(!config_prescriptionUploadEnabled){
	// 	document.getElementById("uploadContainer").style.display = 'none';
	// }
   

    $scope.showApplicationModal = function() {

        
        // function getFullUrl(){
        //     var currentURL = window.location.href; // Get the current URL
        //     var url = new URL(currentURL);
        //     var protocolAndHost = url.protocol + '//' + url.host;
        //     return protocolAndHost
        // }

        // if(!checkURL("/inventory/item/new/0/6/")){
        //     $window.location.href = getFullUrl() + "/prism.shtml#/inventory/item/new/0/6/";
        //     angular.element(document).ready(function() {
        //         document.getElementById("applicationBtn").click()
        //     });
        // }

          var modalInstance = $uibModal.open({
              templateUrl: 'plugins/PLApplication/views/modal/view-application-modal.htm',
              size: 'lg',
              controller: 'ApplicationModalController', // Specify the modal controller
              backdrop : 'static'
              // resolve: {
              //   $uibModalInstance: function () {
              //     return modalInstance;
              //   }
              // }
          });
    };

    

}]);


prismApp.controller('ApplicationModalController', ["$scope", "$timeout", "$location",  function($scope, $timeout, $location) {
    
    // Assign dynamic areas configuration to scope variable
    $scope.areasConfig = areasConfig;

    var selectedArea = {}; // Object to store selected items for each area

    // Initialize selectedArea object with empty arrays for each area
    areasConfig.forEach(function(area) {
        selectedArea[area.field] = [];
    });


    if(!checkURL("/inventory/item/new/0/6/") || !checkURL("/inventory/item/edit/0/6/")){
        // $window.location.href = getFullUrl() + "/prism.shtml#/inventory/item/new/0/6/";
        // var newUrl = getFullUrl() + "/inventory/item/new/0/6/";
        // $location.url("/inventory/item/new/0/6/"); //
        angular.element(document).ready(function() {
            var buttoninvnEditMiscElement = document.querySelector('button[event-name="invnEditMiscTab"]');
            angular.element(buttoninvnEditMiscElement).triggerHandler('click');

            $timeout(function() {
                checkCheckboxes();               
            }, 100);

        });
    }else{
        $timeout(function() {
            checkCheckboxes();               
        }, 100);
    }

    
    // Function to add or remove item from selectedArea based on area field
    $scope.addToSelectedArea = function(item, areaField) {
        var areaNumber = areasConfig.findIndex(function(area) {
            return area.field === areaField;
        });
        
        // Check if the item is checked or unchecked
        if ($scope.checkboxModel[item]) {
            // If checked, add the item to the selectedArea array based on areaNumber
            selectedArea[areaField].push(item);
        } else {
            // If unchecked, remove the item from the selectedArea array (if it exists) based on areaNumber
            var index = selectedArea[areaField].indexOf(item);
            if (index !== -1) {
                selectedArea[areaField].splice(index, 1);
            }
        }
    };
    $scope.closeModal = function(){
        $scope.$close('');
    }

    // Function to save selected items to corresponding ng-model fields
    $scope.saveApplication = function() {
       angular.element(document).ready(function() { 
            areasConfig.forEach(function(area) {
                var fieldToUse = area.field;
                var inputElement = document.querySelector('input[ng-model="$ctrl.service.item.' + fieldToUse + '"]');
                
                if (inputElement) {
                    inputElement.value = selectedArea[fieldToUse].toString();
                    angular.element(inputElement).triggerHandler('input');
                } else {
                    console.error('Input element not found for ng-model: ' + '$ctrl.service.item.' + fieldToUse);
                }
            });

            $scope.$close('');
        });
    };

    
    // Function to check checkboxes based on text value
    function checkCheckboxes(){

        $scope.checkboxModel = {};

        // Loop through areasConfig and check the corresponding checkboxes in checkboxModel
        angular.forEach($scope.areasConfig, function(area) {

            var fieldToUse = area.field;
            var inputElement = document.querySelector('input[ng-model="$ctrl.service.item.' + fieldToUse + '"]').value;

            angular.forEach(area.menu, function(item) {
                if (inputElement.includes(item.trim())) {
                    $scope.checkboxModel[item] = true; // Check the checkbox
                    selectedArea[fieldToUse].push(item);
                }
            });
        });
    };
    

   if(checkURL("/inventory/item/new") || checkURL("/inventory/item/edit"))
   {
      $scope.isSaveButtonEnabled = true;
   }
   
   if(checkURL("/inventory/item/view"))
   {
       $scope.isSaveButtonEnabled = false;
   }

    function getFullUrl(){
        var currentURL = window.location.href; // Get the current URL
		var url = new URL(currentURL);
		var protocolAndHost = url.protocol + '//' + url.host;
        return protocolAndHost
    }

}]);

function checkURL(urlToCheck) {
    const currentURL = window.location.href;
    return currentURL.includes(urlToCheck);
}


