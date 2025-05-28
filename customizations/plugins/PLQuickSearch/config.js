

// Function to register the click event listener
function registerClickEventListener($rootScope, $document, $timeout) {
    $document.on('click', function(event) {
        var tableElement = angular.element(document.querySelector('.scrollable-table'));
        var itemLookupElement = angular.element(document.querySelector('#itemLookupPlg'));
        var lookupItemQuantityElement = angular.element(document.querySelector('#lookupItemQuantity'));

        if (tableElement && tableElement[0] && itemLookupElement && itemLookupElement[0] && lookupItemQuantityElement && lookupItemQuantityElement[0]) {
            if (tableElement[0].contains(event.target) || itemLookupElement[0].contains(event.target) || lookupItemQuantityElement[0].contains(event.target)) {
                hideTableOnBlur = false;
            } else {
                hideTableOnBlur = true;
                $timeout(function() {
                    $rootScope.$apply(function() {
                        $rootScope.isTableVisible = false;
                    });
                });
            }
        } 
    });
}

// Request to get data in dbase
prismApp.factory('DataService', function($http) {

    var session = JSON.parse(sessionStorage.getItem('session'))
 
    return {
        getData: function(config_lookUpFields_ListToQuery) {
            return $http.get('/plugins/PLQuickSearch/dbConnection.php', {
                params: {
                    lookupFields: config_lookUpFields_ListToQuery,
                    lookUpOrderBy: config_lookUpOrderBy,
                    sbs_sid : session.subsidiarysid,
                    store_sid : session.storesid
                }
            });
        }
    };
});

// AngularJS Controller to get data from response from factory data service
prismApp.controller('DataController', function($scope, DataService) {
    $scope.filteredData = []; // Initialize filteredData
    $scope.headerFields = []; // Initialize headerFields

    // Fetch the initial data
    DataService.getData(config_lookUpFields_ListToQuery, config_lookUpOrderBy)
        .then(function(response) {
            $scope.data = response.data;
            $scope.filteredData = angular.copy($scope.data); // Initialize filteredData with all data

             // Extract field names from the first item in data
             $scope.availableFields = Object.keys(response.data[0]);
             
             // Extract field names from the configuration header string
            $scope.headerFields = config_lookUpFields_ListHeader

            // Extract fields to Display from configuration
            $scope.fieldsToDisplay = config_lookUpFields_ListToDisplay
        })
        .catch(function(error) {
            console.error('Error fetching data:', error);
        });
});

// SideButtonsManager.addButton({
//     label: 'Button 1',
//     icon: 'images/checked_32.png',
//     sections: ['register', 'transactionRoot', 'transactionEdit'],
//     handler:  function(ModelService){
    
//         ModelService.get('Inventory',{document_sid:'683140179000454212'}).then(function(data){
//             console.log(data[0]);
//         });

//         // var test = ModelService.create('Item'); // create new instance of the model object
//         // test.invn_sbs_item_sid = "683133150000430122"; // required field
//         // test.insert(); //

//     }
// });