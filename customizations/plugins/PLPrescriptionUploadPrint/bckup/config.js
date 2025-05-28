var config_prescriptionUploadDirectory = "";
var config_dcssid = "671256935000140794";
var config_dcscode = "1  1  1";
var config_vendsid = "672559087000195922";















prismApp.service('PrescriptionService', ['$http', 'ModelService', function ($http, ModelService) {
    
    var session = JSON.parse(sessionStorage.getItem('session'));

    function buildApiUrl(queryStringParams) {
        var apiUrl = window.location.protocol + "//" + window.location.host + '/api/backoffice/inventory';
        
        var queryString = Object.keys(queryStringParams)
            .map(function (key) {
                return key + '=' + queryStringParams[key];
            })
            .join('&');
        
        return apiUrl + '?' + queryString;
    }
    
    function sendPostRequest(queryStringParams, requestData) {
        var headers = {
            'Accept': 'application/json,version=2',
            'Auth-Session': session.token,
            'Content-Type': 'application/json',
        };
        
        var apiUrl = buildApiUrl(queryStringParams);

        // Send a POST request to the API with the request payload
        return $http({
            method: 'POST',
            url: apiUrl,
            data: requestData,
            headers: headers
        }).then(function (response) {
            // Return the response data to the caller
            return response.data;
        }).catch(function (error) {
            // Handle any errors here
            console.error('Error:', error);
            // Return an empty array or a suitable value as needed
            return [];
        });
    }
    
    this.getPrescriptions = function () {

        return getCustomerSid().then(function(btCuid) {
            var customer_sid = ""
            customer_sid = btCuid;

            // Define your request data here
            var requestData = {
                data: [
                    {
                        activestoresid: session.storesid,
                        activepricelevelsid: session.pricelevelsid,
                        activeseasonsid: session.seasonsid
                    },
                ],
            };

            var queryStringParams = {
                action: 'inventorygetitems',
                filter: '(text3,eq,' + customer_sid +')AND(active,eq,false)AND(text4,eq,"PHARMA")AND(text5,eq,"ACTIVE")AND(sbssid,eq,' + session.subsidiarysid + ')',
                count: true,
                page_no: 1,
                page_size: 30,
                cols: '*',
                sort: 'description1,asc;sid,asc',
            };

            return sendPostRequest(queryStringParams, requestData);

        })
        .catch(function(error) {
            console.error("Error:", error);
        });

        
    };
    
    this.savePrescriptions = function (prscrptDtls, document_sid, customer_sid) {
        // Define your request data here

        
            var currentDateTime = formatDateTime();
            var requestData = {
                "data": [
                    {
                        "OriginApplication": "RProPrismWeb",
                        "PrimaryItemDefinition": {
                            "dcssid": config_dcssid,
                            "vendsid": config_vendsid,
                            "description1": currentDateTime,
                            "description2": document_sid,
                        },
                        "InventoryItems": [
                            {
                                "sbssid": session.subsidiarysid,
                                "dcssid": config_dcssid,
                                "vendsid": config_vendsid,
                                "description1": currentDateTime,
                                "description2": document_sid,//invc_sid
                                "description3": session.storecode,
                                "description4": prscrptDtls.isRenewable,
                                "text1": prscrptDtls.doctorName,
                                "text2": prscrptDtls.fileName,
                                "text3": customer_sid,
                                "text4": "PHARMA",
                                "text5": "ACTIVE",
                                "active": false,
                                "noninventory": true,
                                "activestoresid": session.storesid,
                                "activepricelevelsid": session.pricelevelsid,
                                "activeseasonsid": session.seasonsid,
                                "dcscode": config_dcscode
                            }
                        ]
                    }
                ]
            };

            var queryStringParams = {
                action: 'InventorySaveItems'
            };

            return sendPostRequest(queryStringParams, requestData);
       

        
    };

    this.getItemStyleChecks = function (document_sid) {
        
        // Define your request data here
        var requestData = {
            "data": [
                {  
                    "ChkDuplicateItem": true,
                    "InventoryItem": {
                        "sbssid": session.subsidiarysid,
                        "dcssid": "656134366000192897",
                        // "vendsid": "656134367000168918",
                        "description1": formatDateTime(),
                        "description2": document_sid
                    }
                }
            ]
        };

        var queryStringParams = {
            action: 'GetItemStyleChecks'
        };
        
        return sendPostRequest(queryStringParams, requestData);
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

function formatDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours() % 12 || 12).padStart(2, '0'); // 12-hour format
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

    const formattedDateTime = `${year}${month}${day} ${hours}:${minutes}:${seconds}${ampm}`;
    return formattedDateTime;
}

// Request to get data in dbase
prismApp.factory('DataServiceUpload', function($http) {
    
    return {
        uploadImage: function(customerId) {
            var imageUploadInput = document.getElementById("imageUpload");
            var imageFiles = imageUploadInput.files;

            if (imageFiles.length === 0) {
                alert("Please select one or more images.");
                return false;
            }

            // Set the default upload directory if not provided
            config_prescriptionUploadDirectory = config_prescriptionUploadDirectory || '/PRESCRIPTIONS/';

            var formData = new FormData();
            for (var i = 0; i < imageFiles.length; i++) {
                formData.append("imageFiles[]", imageFiles[i]);
            }
            formData.append("uploadDirectory", config_prescriptionUploadDirectory);
            formData.append("customerId", customerId);

            var config = {
                headers: {
                    'Content-Type': undefined
                }
            };
            
            return $http.post('/plugins/PLPrescriptionUploadPrint/uploadImage.php', formData, config)
            .then(function(response) {
                return response.data;
            })
            .catch(function(error) {
                console.log('Error uploading file:', error);
            });
        }
    };
});



SideButtonsManager.addButton({
    label: 'Button 1',
    icon: 'images/checked_32.png',
    sections: ['register', 'transactionRoot', 'transactionEdit'],
    handler: function (ModelService) {
        
        // get specific Inventory
        ModelService.get('Inventory',{sid:'684061878000443823',cols:'*'}).then(function(data){
            var test = data[0]; // assign returned data to variable
            test.text5 = "ACTIVE"
            test.save(); // run function on variable
        });

    }
});