// ButtonHooksManager.addHandler(['before_posTransactionTenderTransaction'],
//     function($q, $state, DocumentPersistedData, NotificationService, ResourceNotificationService, $uibModal, Templates, ModelService, ModelService2, $rootScope, HookEvent, $stateParams, base64, $http, prismSessionInfo, authService, $window, LoadingScreen) {
//         var deferred = $q.defer();
//             LoadingScreen.Enable = 1;
// 			var documentSid = $stateParams.document_sid;
//             if(sessionStorage.details === undefined){
//                 deferred.resolve();
//             }else{
//                 ModelService.get('Document', {sid: documentSid, cols: "*"}).then(function(docData) {
//                     var document = docData[0];
//                     if(document.status == 3 && document.receipt_type == 0){
//                         ModelService.get('Item', {document_sid: documentSid, cols: "*"}).then((items) => {
//                             var errorMessages = [];
                        
//                             items.forEach(function (item) {
//                                 if (item.note2 && item.note2.trim() !== "") {
//                                     console.log("note2 has a value:", item.note2);
//                                 } else {
//                                     errorMessages.push('Error: This item ' + item.item_description1 + ' has no discount [' + item.alu + ']. please remove this item.');
//                                 }
//                             });
                            
                        
//                             if (errorMessages.length > 0) {
//                                 errorMessages.forEach(msg => {
//                                     ResourceNotificationService.showError(msg);
//                                 });
//                                 LoadingScreen.Enable = 0;
//                                 deferred.reject();  // Stop further actions
//                             } else {
//                                 deferred.resolve();  // All items passed the check
//                             }
//                         });
//                     }else{
//                         LoadingScreen.Enable = 0;
//                         deferred.resolve();
//                     }
//                 });
//             }
//         return deferred.promise;
//     }
// );