var session = JSON.parse(sessionStorage.getItem('session'));

prismApp.controller('prescriptionController', ["$scope", "$uibModal", "PrescriptionService", function($scope, $uibModal) {
	
    $scope.openModal = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/prescription-modal.htm',
            size: 'lg',
            controller: 'PrescriptionModalController', // Specify the modal controller
			resolve: {
				$uibModalInstance: function () {
					return modalInstance;
				}
			}
        });
    };

    

}]);

prismApp.controller('PrescriptionModalController', ["$scope", "$uibModal", "PrescriptionService", "DataServiceUpload", "Toast", "ModelService", function($scope, $uibModal, PrescriptionService, DataServiceUpload, Toast, ModelService) {

	$scope.prescriptions = []; // Initialize the array

	loadPrescriptions(PrescriptionService);
	function loadPrescriptions(PrescriptionService){
		PrescriptionService.getPrescriptions().then(function (prescriptions) {
			$scope.prescriptions = prescriptions.data;
			document.getElementById("savePrescriptionBtn").innerHTML = "Save";
		});
	}

	$scope.openImageUpload = function() {
		document.getElementById('imageUpload').click();
	};

	$scope.selectedImage = 'https://www.templatesfront.com/wp-content/uploads/2016/05/prescription-template-74-205x300.jpg'; // Initialize it to an empty string

	$scope.openImageUpload = function() {
		document.getElementById('imageUpload').click();
	};
	
	$scope.updateImagePreview = function(input) {
		if (input.files && input.files.length > 0) {
			$scope.selectedImages = [];
	
			for (var i = 0; i < input.files.length; i++) {
				var reader = new FileReader();
	
				reader.onload = function(e) {
					$scope.$apply(function() {
						$scope.selectedImages.push(e.target.result);
					});
				};
	
				reader.readAsDataURL(input.files[i]);
			}
		} else {
			$scope.selectedImages = [];
		}
	};
	
	//save
	var editPrescriptionValue = [];
	$scope.savePrescription = function() 
	{	
		if(document.getElementById("savePrescriptionBtn").innerHTML === "Save")
		{
			savePrescription()
		}
		else
		{
			updatePrescription(editPrescriptionValue);
		}
	};


	var selectedPrescriptions = []; // Initialize an array to store selected prescriptions

	$scope.addToSelectedPrescriptions = function(prescription) {
		if (prescription.RF) {
			// If the checkbox is checked, add the prescription to the array
			selectedPrescriptions.push(prescription.sid);
		} else {
			// If the checkbox is unchecked, remove the prescription from the array (if it exists)
			var index = selectedPrescriptions.indexOf(prescription.sid);
			if (index !== -1) {
				selectedPrescriptions.splice(index, 1);
			}
		}
	};

	function savePrescription()
	{
		var document_sid = getDocumentSid();
		var prscrptDtls = {
			doctorName : document.getElementById("doctorName").value,
			fileName : document.getElementById("imageUpload").value.split("\\").pop(),
			isRenewable : rnCheckbox.checked
		}
		
		if(!prscrptDtls.doctorName){
			alert("Docort's Name is Required!")
			document.getElementById("doctorName").focus();
			return false;
		}


		getCustomerSid().then(function(btCuid) {
            var customer_sid = ""
            customer_sid = btCuid;


			DataServiceUpload.uploadImage(customer_sid).then(function(data) 
			{
				if(data.success)
				{
					PrescriptionService.getItemStyleChecks(document_sid).then(function(itemStyle) 
					{
						if (itemStyle.data[0].isduplicatestyle == false && itemStyle.data[0].duplicateitemstatus == 0) 
						{
							PrescriptionService.savePrescriptions(prscrptDtls, document_sid, customer_sid, selectedPrescriptions).then(function(savePrescriptionsData){
								Toast.Success('Prescription', 'File Uploaded Sucessfully');
								PrescriptionService.getPrescriptions().then(function (prescriptions) {
									$scope.prescriptions = prescriptions.data;
									$scope.$close('');
									var modalInstance = $uibModal.open({
										templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/prescription-modal.htm',
										size: 'lg',
										controller: 'PrescriptionModalController', // Specify the modal controller
										resolve: {
											$uibModalInstance: function () {
												return modalInstance;
											}
										}
									});
								});
								
							});
						} 
						else 
						{
							console.log("Item conditions not met");
						}

					});
				}

			});
		})
        .catch(function(error) {
            console.error("Error:", error);
        });
	}

	function updatePrescription(prescription)
	{	
		getCustomerSid().then(function(btCuid) {
		var customer_sid = ""
		customer_sid = btCuid;

		DataServiceUpload.uploadImage(customer_sid).then(function(data) 
			{	
				if(data.success)
				{
					ModelService.get('Inventory',{sid:prescription.sid}).then(function(data){

						var imageUploadInput = document.getElementById("imageUpload");
						var fileName = imageUploadInput.files[0].name; 
						var response = data[0]; // assign returned data to variable
						// response.text1 = prescription.text1
						response.text1 = document.getElementById("doctorName").value
						
						response.text2 = fileName;
						response.description4 = prescription.description4
						response.save(); // run function on variable
						
						Toast.Success('Prescription', 'File Updated Sucessfully');
						$scope.$close('');
						var modalInstance = $uibModal.open({
							templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/prescription-modal.htm',
							size: 'lg',
							controller: 'PrescriptionModalController', // Specify the modal controller
							resolve: {
								$uibModalInstance: function () {
									return modalInstance;
								}
							}
						});	
					});

					
				}
				
			});

		})
        .catch(function(error) {
            console.error("Error:", error);
        });
	}
	
	$scope.closePrescription = function() {
        if (document.getElementById("closePrescriptionBtn").innerHTML === "Close") {
            // Close the modal using the modal's $uibModalInstance
            $scope.$close('');
        } else {
            document.getElementById("closePrescriptionBtn").value = "";
			document.getElementById("doctorName").value = "";
			document.getElementById("rnCheckbox").checked = false;
			document.getElementById("closePrescriptionBtn").innerHTML = "Close"
			document.getElementById("savePrescriptionBtn").innerHTML = "Save"
			$scope.selectedImages = [];
			
        }
    };

	$scope.deletePrescription = function(itemSid) {
		// get specific Inventory
        ModelService.get('Inventory',{sid:itemSid, cols:'*'}).then(function(data){
            var response = data[0]; // assign returned data to variable
            response.text5 = "DELETE"
            response.save(); // run function on variable

			Toast.Success('Prescription', 'File Updated Sucessfully');
			$scope.$close('');
			var modalInstance = $uibModal.open({
				templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/prescription-modal.htm',
				size: 'lg',
				controller: 'PrescriptionModalController', // Specify the modal controller
				resolve: {
					$uibModalInstance: function () {
						return modalInstance;
					}
				}
			});	
        });
	};

	$scope.editPrescription = function(prescription) {
		
		document.getElementById("savePrescriptionBtn").innerHTML = "Update";
		document.getElementById("closePrescriptionBtn").innerHTML = "Cancel";

		document.getElementById("doctorName").value = prescription.text1;
		document.getElementById("rnCheckbox").checked = prescription.description4 === 'true' ? true : false;

		var currentURL = window.location.href; // Get the current URL
		var url = new URL(currentURL);
		var protocolAndHost = url.protocol + '//' + url.host;


		$scope.selectedImages = [ protocolAndHost + "/" + "PRESCRIPTIONS" + "/" + prescription.text3 + "/" + prescription.text2];
		editPrescriptionValue = prescription;
	};

	$scope.viewPrescription = function(prescription) {
		
		
		// window.open('', '_blank', 'width=600,height=400');
		// Open a new browser window with specific dimensions and features
		// window.open(
		// 	'http://gti-sysdev-004.gti.com.ph:8080/plugins/PLPrescriptionUploadPrint/views/test.htm',
		// 	'_blank',
		// 	'width=600,height=400,top=100,left=100,alwaysRaised=yes'
		// );
  
		$scope.$close('');

		var imageUrl = window.location.protocol + "//" + window.location.host + '\\PRESCRIPTIONS\\' + prescription.text3 + '/' + prescription.text2;
		var imageUrl1 = "http://gti-sysdev-004.gti.com.ph:8080\\PRESCRIPTIONS\\2000000007/KR1.png";


		var modalInstance1 = $uibModal.open({
			templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/view-prescription-modal.htm',
			controller: 'viewPrescriptionModalController', // Specify the modal controller
			backdrop: "static",
			windowClass: 'custom-modal-class', // Apply the custom modal class
			backdropClass: 'custom-modal-backdrop', // Apply the custom backdrop class
			resolve: {
				prescription1: function () {
				  return imageUrl; // Pass the prescription data to the modal controller
				}
			}

			
			
			// show: true
		});
		
		
		// Make the modal draggable using jQuery UI
		modalInstance1.rendered.then(function () {
			$( document ).ready(function() {
				console.log( "ready!" );
				
				$(".modal-dialog").draggable({
					handle: ".modal-header"
				});

				
			});
			
		});
		
		// // reset modal if it isn't visible
		// if (!($('.modal.in').length)) {
		// 	$('.modal-dialog').css({
		// 	  top: 0,
		// 	  left: 0
		// 	});
		//   }
		//   $('#myModal').modal({
		// 	backdrop: false,
		// 	show: true
		//   });
		
		//   $('.modal-dialog').draggable({
		// 	handle: ".modal-header"
		//   });

		// get specific Inventory
        // ModelService.get('Inventory',{sid:itemSid, cols:'*'}).then(function(data){
        //     var response = data[0]; // assign returned data to variable
        //     response.text5 = "DELETE"
        //     response.save(); // run function on variable
        // });
	};



	function getCustomerSid(){
        return ModelService.get('Document',
        {
            sid: getDocumentSid()
        })
            .then(function(data){
            return data[0].bt_id;
        });
    }

}]);

prismApp.controller('viewPrescriptionModalController', ["$scope", "$uibModal", "prescription1", function($scope, $uibModal, prescription1) {
	$scope.prescription = {}; // Initialize prescription as an empty object
	$scope.prescription.imageUrl = prescription1;

	
	// Define the goBack function to handle the back action
	$scope.goBack = function() {
		$scope.$close('');
		var modalInstance = $uibModal.open({
			templateUrl: 'plugins/PLPrescriptionUploadPrint/views/modal/prescription-modal.htm',
			size: 'lg',
			controller: 'PrescriptionModalController', // Specify the modal controller
		});
		
	};

	// Define the closeModal function to handle modal closing
	$scope.closeModal = function() {
		$scope.$close('');
	};

}]);

function getDocumentSid(){
    const url = window.location.href;
    // Split the URL by slashes
    const parts = url.split('/');
    // Find the part that contains the desired value
    const docsId = parts.find(part => /^[0-9]+$/.test(part));
    return docsId;

}

prismApp.directive('zoomAndPrint', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            let currentZoom = 1;
            let isDragging = false;
            let dragStartX, dragStartY;
            let offsetX = 0;
            let offsetY = 0;

            const zoomableImage = element.find("#zoomable-image");

            function updateZoom() {
                zoomableImage.css("transform", `scale(${currentZoom})`);
            }

            function enableDragging() {
                if (currentZoom > 1) {
                    zoomableImage.css("cursor", "grab");
                } else {
                    zoomableImage.css("cursor", "auto");
                }
            }

            // Zoom in
            element.on('click', '#zoom-in-button', function() {
                currentZoom += 0.1;
                updateZoom();
                enableDragging();
            });

            // Zoom out
            element.on('click', '#zoom-out-button', function() {
                if (currentZoom > 1) {
                    currentZoom -= 0.1;
                    updateZoom();
                    enableDragging();
                }
            });

            element.on('wheel', '#zoomable-image', function(event) {
                event.preventDefault();

                if (event.originalEvent.deltaY > 0) {
                    // Scroll down to zoom out
                    if (currentZoom > 1) {
                        currentZoom -= 0.1;
                        updateZoom();
                    }
                } else {
                    // Scroll up to zoom in
                    currentZoom += 0.1;
                    updateZoom();
                }
                enableDragging();
            });

            element.on('mousedown', '#zoomable-image', function(event) {
                isDragging = true;
                dragStartX = event.clientX - offsetX;
                dragStartY = event.clientY - offsetY;
            });

            element.on('mousemove', function(event) {
                if (isDragging) {
                    offsetX = event.clientX - dragStartX;
                    offsetY = event.clientY - dragStartY;

                    zoomableImage.css("left", offsetX + "px");
                    zoomableImage.css("top", offsetY + "px");
                }
            });

            element.on('mouseup', function() {
                isDragging = false;
            });

            element.on('click', '#print-button', function() {
				// const test = element.find("body");
				// test.css("display", "none")
				// zoomableImage.css("display", "block")

				 // Hide the body (except for #zoomable-image)
				 $('#prismBody').children().css('display', 'none');
				 $('#myModal').children().css('display', 'none');
				 $('#printPrescriptionImage').css('display', 'block');
		   
				 // Trigger the print dialog
				 window.print();

				 $('#prismBody').children().css('display', 'block');
				 $('#myModal').children().css('display', 'block');
				 $('#printPrescriptionImage').css('display', 'none');
		
            });

            // Set the draggable attribute to false to prevent the browser's default drag behavior
            zoomableImage.attr('draggable', 'false');

            // Initial setup
            updateZoom();
            enableDragging();
        }
    };
});

// Clone the modal content
// const printContent = $('#zoomable-image').clone();

// // Create a new window for printing
// const printWindow = window.open('', '', 'width=600,height=600');

// // Append the cloned content to the new window
// printWindow.document.body.appendChild(printContent[0]);

// // Adjust styles for printing
// printContent.find('.no-print').remove(); // Remove elements with class 'no-print'
// printContent.find('body').css('visibility', 'visible');

// // Print the content
// printWindow.print();




// prismApp.controller('prescriptionParentController', ["$scope", function($scope) {
//     $scope.closePrescription = function() {
//         if (document.getElementById("closePrescriptionBtn").innerHTML === "Close") {
//             // Close the modal using the modal's $uibModalInstance
//             $scope.$close('');
//         } else {
//             document.getElementById("closePrescriptionBtn").value = "";
// 			document.getElementById("doctorName").value = "";
// 			document.getElementById("rnCheckbox").checked = false;
// 			$scope.selectedImages = [];
//         }
//     };
// }]);


// (function($) {
// 	$(document).ready(function () {
// 		// Use event delegation for dynamically created elements
// 		const $image = $("#zoomable-image");
// 		let currentZoom = 1; // Initialize currentZoom
// 		$(document).on('click', '#zoom-in-button', function () {
// 		  currentZoom += 0.1;
// 		  $image.css("transform", `scale(${currentZoom})`);
// 		});
	  
// 		$(document).on('click', '#zoom-out-button', function () {
// 		  currentZoom -= 0.1;
// 		  $image.css("transform", `scale(${currentZoom})`);
// 		});
	  
// 		$(document).on('click', '#print-button', function () {
// 		  window.print();
// 		});
// 	  });
//   })(jQuery);
  