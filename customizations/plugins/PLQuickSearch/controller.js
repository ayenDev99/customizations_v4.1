var session = JSON.parse(sessionStorage.getItem('session'));

//trigger ng-keyup and filter data table base on keyword
prismApp.controller('FilterController', function($scope, $rootScope, $document, $timeout) {
    
    // Function to check if the URL contains "register/pos/docs"
    function checkURL() {
        const url = window.location.href;
        return url.includes("register/pos/docs");
    }

    if (!config_quickSearchEnabled || !checkURL()){
        $rootScope.isQtyTboxVisible = false;
        $rootScope.isItemLookUpPlgVisible = false;
        $rootScope.isItemLookUpOrigVisible = true;
        return;
    }
    
    $rootScope.isQtyTboxVisible = true;
    $rootScope.isItemLookUpPlgVisible = true;
    $rootScope.isItemLookUpOrigVisible = false;


    // Set an initial flag to determine if the table should be hidden on blur
    var hideTableOnBlur = true;

    // Attach a function to the $rootScope that will be called when the textbox gains focus
    var firstFocus = true;
    $rootScope.showTableOnFocus = function() {

        if(firstFocus)
        {
            firstFocus=false;
            $rootScope.isTableVisible = false;
            hideTableOnBlur = true ;

            $timeout(function() {
                document.getElementById('lookupItemQuantity').focus();
            }, 1000);

        }
        else
        {
            $rootScope.isTableVisible = true;
            hideTableOnBlur = false; // Set to false when focusing the textbox
        }
        
        
    };

    // Attach a function to the $rootScope that will be called when the textbox loses focus
    $rootScope.hideTableOnBlur = function() {
        // Delay the hiding of the table to check if the click happened within the table
        $timeout(function() {
            if (hideTableOnBlur) {
                $rootScope.isTableVisible = false;
            }
            hideTableOnBlur = true; // Reset the flag
        }, 100); // Adjust the delay as needed
    };

    registerClickEventListener($rootScope, $document, $timeout);
    
    $scope.filterFunction = function() {
        var input = document.getElementById("itemLookupPlg");
        var filter = input.value.trim().toUpperCase();
        var dropdown = document.getElementById("itemListTable");
        var rows = dropdown.getElementsByClassName("table-row-data");
        var itemNotFound = document.getElementById("itemNotFound");

        if (filter === "") {
            Array.from(rows).forEach(function(row) {
                row.style.display = ""; // Show all rows
            });

            itemNotFound.style.display = "none";
            displayedCount = 1;
        } else {
            var displayedCount = 0;
            
            Array.from(rows).forEach(function(row) {
                var txtValue = row.textContent || row.innerText;
                var shouldDisplay = txtValue.toUpperCase().includes(filter);

                row.style.display = (shouldDisplay && displayedCount < config_lookUpMaxDisplayedResultCount) ? "" : "none";

                if (shouldDisplay && displayedCount < config_lookUpMaxDisplayedResultCount) {
                    displayedCount++;
                }
            });
        }

        itemNotFound.style.display = (displayedCount > 0) ? "none" : "";
    };

    $scope.data = []; // Your data

    $scope.selectedItem = null; // To keep track of the currently selected item

    // Function to toggle selection of a row
    $scope.toggleSelection = function(item) {
        if ($scope.selectedItem === item) {
            // Clicked on the already selected item, deselect it
            $scope.selectedItem = null;
            item.selected = false;
        } else {
            // Clicked on a different item, select it and deselect others
            angular.forEach($scope.data, function(row) {
                row.selected = false;
            });
            $scope.selectedItem = item;
            item.selected = true;
        }
    };
    
});

function getDocumentId(){
    const url = window.location.href;
    // Split the URL by slashes
    const parts = url.split('/');
    // Find the part that contains the desired value
    const docsId = parts.find(part => /^[0-9]+$/.test(part));
    return docsId;

}

prismApp.factory('PostItemService', function($http) {
    
    return {
        insertItem: function(itemData, documentSid) {

            var url = window.location.protocol + "//" + window.location.host + '/v1/rest/document/' + documentSid + '/item';

            var headers = {
                'Accept': '*/*',
                'Auth-Session': session.token,
                'Content-Type': 'application/json',
            };

            return $http({
                method: 'POST',
                url: url,
                data: itemData,
                headers: headers
            });
        }
    };
});

prismApp.controller('ItemTableData', function($scope, $state, $rootScope, $document, $timeout, PostItemService) {

    $scope.addToTransaction = function(item) {
        var documentSid = getDocumentId()
        // Create a copy of newItemData to avoid modifying the original object
        var newItemData = [{
            "origin_application": session.application,
            "invn_sbs_item_sid": item.sid,
            "fulfill_store_sid": session.storesid,
            "document_sid": documentSid,
            "kit_type": parseInt(item.kit_type),
            "item_type": 1,
            "quantity": document.getElementById("lookupItemQuantity").value
        }];

        // Insert data using the service
        PostItemService.insertItem(newItemData, documentSid)
            .then(function(response) {
                $state.reload().then(function() {
                    // After state reload, re-register the click event listener
                    registerClickEventListener($rootScope, $document, $timeout);
                });
                
            })
            .catch(function(error) {
                console.error('Error inserting item:', error);
                registerClickEventListener($rootScope, $document, $timeout);
            });

    };
    
});
