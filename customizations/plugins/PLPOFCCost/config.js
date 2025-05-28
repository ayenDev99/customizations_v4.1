
ButtonHooksManager.addHandler(['before_changeFCCost'],
    function(LoadingScreen, $q, DocumentPersistedData, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $state, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, NotificationService) {
    	var deferred = $q.defer();

        var sid = $('[event-name="changeFCCost"]').attr('data-item-sid');
        var rowversion = $('[event-name="changeFCCost"]').attr('data-item-rowversion');
        var fccost = $('[event-name="changeFCCost"]').attr('data-item-fccost');

        var newfccost = prompt("Enter FC Cost", fccost);

        if (isValidNumericDecimalFormat(newfccost)) {
            var params = {
                "data": [
                    {
                        "rowversion": parseInt(rowversion),
                        "fccost": parseFloat(newfccost),
                    }
                ]
            };

            $http.put('api/backoffice/purchaseorder/691206267000178505/poitem/' + sid, params, {headers: {"Auth-Session": sessionStorage.getItem("PRISMAUTH")}}).then(function(emps){
                $state.go($state.current, {}, {reload: true});

            });
        } else {
            alert("Invalid numeric or decimal format. Please enter a valid numeric or decimal value.");
        }

        deferred.reject();
    	return deferred.promise;
    }
);

function isValidNumericDecimalFormat(input) {
  // Define a regular expression for numeric and decimal format
  var numericDecimalRegex = /^\d+(\.\d{1,2})?$/;

  // Test the input against the regular expression
  return numericDecimalRegex.test(input);
}