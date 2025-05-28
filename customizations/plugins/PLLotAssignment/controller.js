prismApp.controller('LotController', function ($scope, ModelService2) {

    if (!config_lotAssignmentPluginsEnabled){
      $scope.islotAssignOrigVisible = true;
      $scope.islotAssignPlgVisible = false;

      return;
    }

    $scope.islotAssignOrigVisible = false;
    $scope.islotAssignPlgVisible = true;

    var session = JSON.parse(sessionStorage.getItem('session'));

    $scope.toggleLotTable = function () {
        $scope.isLotTableVisible = !$scope.isLotTableVisible;
    };

    $scope.setLotNumberClick = function(lotNumber){
       var inputField = document.getElementById("itemLotNumberPlg0");
       inputField.value = lotNumber;
    }

    $scope.getExpiryStatus = function(expiryDate) {
      var expiry = new Date(expiryDate);
      var monthsDifference = (expiry - new Date()) / (1000 * 60 * 60 * 24 * 30);
    
      if (monthsDifference < 0) {
        return 'expired'; // Font color should be red
      } else if (monthsDifference < 6) {
        return 'soon'; // Font color should be orange
      } else {
        return ''; // No special styling
      }
    };    
    
    $scope.isExpired = function (expiryDate) {
      var expiry = new Date(expiryDate);
      var currentDate = new Date();
      
      return expiry < currentDate;
    };
  
    function findNearestNonExpiredExpiryItem(items) { //with checking the quantity
      if (!items || items.length === 0) 
      {
        return null; // No items to compare
      }
    
      var nearestItem = null;
      var currentDate = new Date();
    
      for (var i = 0; i < items.length; i++) 
      {
        var item = items[i];
        
        // Check if invnlotqty is an array and it has at least one item with qty > 0
        if (Array.isArray(item.invnlotqty) && item.invnlotqty.length > 0 && item.invnlotqty[0].qty > 0) 
        {
          var expiryDate = new Date(item.expirydate);
    
          if (expiryDate > currentDate) 
          {
            if (!nearestItem || expiryDate < nearestItem.expiryDate) 
            {
              nearestItem = item;
            }
          }
        }
      }
      
      return nearestItem;
    }
  
  
    $scope.lotData = []; // Initialize the array to hold lot data
    // Fetch data and call the DOM manipulation function
    ModelService2.get('InvnLot', {
      cols: '*,invnlotqty.*',
      sort: 'expirydate,asc',
      filter: '(invnlotqty.storesid,eq,' + session.storesid + ')AND(sbssid,eq,' + session.subsidiarysid + ')AND(active,eq,' + session.active + ')AND(invnlotqty.qty,gt,0)&count=true&page_no=1&page_size=15',
      count: true,
      page_no: 1,
      page_size: 15
    }).then(function (data) {

      $scope.lotData = data; // Set the fetched data to the scope variable
        // Find the item with the nearest expiry date
        var nearestExpiryItem = findNearestNonExpiredExpiryItem(data);

        if (nearestExpiryItem) {
            // Find the input field by its ID
            var inputField = document.getElementById('itemLotNumberPlg0');

            // Set the value of the input field to the nearest expiry item's lot number
            inputField.value = nearestExpiryItem.lotnumber || '';
        }

    });
    
   
});
  



// Function to find the item with the nearest expiry date
//   function findNearestExpiryItem(items) {
//     if (!items || items.length === 0) {
//         return null; // No items to compare
//     }

//     var nearestItem = items[0];
//     var currentDate = new Date();

//     for (var i = 1; i < items.length; i++) {
//         var item = items[i];
//         var expiryDate = new Date(item.expirydate);

//         if (expiryDate < nearestItem.expiryDate && expiryDate > currentDate) {
//             nearestItem = item;
//         }
//     }

//     return nearestItem;
// }

  // Function to find the item with the nearest non-expired expiry date withou qty
  // function findNearestNonExpiredExpiryItem(items) {
  //   if (!items || items.length === 0) {
  //       return null; // No items to compare
  //   }

  //   var nearestItem = null;
  //   var currentDate = new Date();

  //   for (var i = 0; i < items.length; i++) {
  //       var item = items[i];
  //       var expiryDate = new Date(item.expirydate);

  //       if (expiryDate > currentDate && (!nearestItem || expiryDate < nearestItem.expiryDate)) {
  //           nearestItem = item;
  //       }
  //   }

  //   return nearestItem;
  // }




// prismApp.controller('LookupLotController', function ($) {

//     // Wait for the grid to be initialized (you may need to adjust the timing)
//     setTimeout(function() {
//       // Select the grid container by its ID
//       var gridContainer = document.getElementById('grid1');

//       // Find all elements with class "ui-grid-cell-contents" inside the grid container
//       var cellContents = gridContainer.querySelectorAll('.ui-grid-cell-contents');

//       // Loop through the cell contents elements
//       cellContents.forEach(function(cellContent) {
//         // Get the text content of the cell
//         var cellText = cellContent.textContent.trim();

//         // Check if the cell text is '-1' (or apply your own condition)
//         if (cellText === '-1') {
//           // Apply the desired styling (e.g., set font color to red)
//           cellContent.style.color = 'red';
//         }
//       });
//     }, 1000); // Adjust the timeout as needed to ensure the grid is fully initialized

// });

