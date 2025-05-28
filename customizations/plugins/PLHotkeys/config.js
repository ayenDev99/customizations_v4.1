window.angular.module('prismApp').directive('keydownListener', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {

        var globalHotkeys = null;
        var deleteFocusKeycode = null;

        fetch('/plugins/PLHotkeys/hotkeys.json')
            .then(response => response.json())
            .then(data => {
                globalHotkeys = data;
                deleteFocusKeycode = data.general.paths[0].keys[5].keycode;
            }).catch(error => {
                // Handle any errors that occur during the fetch
                console.error(error);
            });

        element.on('keydown', function(e) {
            var isRefreshKey = (e.ctrlKey && e.shiftKey && e.which == 82);
            var isBrowserCacheKey = (e.ctrlKey && e.shiftKey && e.which == 46);
            var zoomIn = (e.ctrlKey && e.which == 187);
            var zoomOut = (e.ctrlKey && e.which == 189);
            var tab = (e.tabKey);

            var keydownCode = e.which;
            var keydownCtrlKey = e.ctrlKey;
            var keydownAltKey = e.altKey;
            var keydownShiftKey = e.shiftKey;

            if (keydownCode == deleteFocusKeycode) {
                $(':focus').blur();
            } else if (is_hotkeys_enabled && !$('#hotkeysModal').length && !isInputFocused() && !isRefreshKey && !isBrowserCacheKey && !zoomIn && !zoomOut && !tab) {
                
                e.preventDefault();
                e.stopPropagation();
                var pathname = window.location.href.match(/:\/\/[^/]+(\/[^?]*)/)[1];

                for (var prop in globalHotkeys) {
                    if (globalHotkeys.hasOwnProperty(prop)) {
                        var isURLPathPassed = false;
                        var urlPath = globalHotkeys[prop].url_path;
                        var urlPathSplit = urlPath.split(',');
                        $.each(urlPathSplit, (index, url) => {
                            var urlSplit = url.split('?');
                            if (urlSplit.length == 1) {
                                if (url == pathname) {
                                    isURLPathPassed = true;
                                }
                            } else {
                                if (urlSplit[0] == pathname.substring(0, urlSplit[0].length)) {
                                    isURLPathPassed = true;
                                }
                            }
                        });
                        if (isURLPathPassed || globalHotkeys[prop].url_path == '/') {
                            // console.log(pathname);
                            var paths = globalHotkeys[prop].paths;
                            // console.log(paths);
                            for (var i = 0; i < paths.length; i++) {
                                var keys = paths[i].keys;
                                // console.log(keys);
                                for (var x = 0; x < keys.length; x++) {

                                    if (keys[x].keycode == keydownCode && keys[x].ctrlKey == keydownCtrlKey && keys[x].altKey == keydownAltKey && keys[x].shiftKey == keydownShiftKey) {

                                        var targets = keys[x].targets.slice();
                                        
                                        targets.forEachWithCallback((el, i, next) => {
                                            var elem = el.element;
                                            var even = el.event;
                                            var proceedToNextTarget = el.proceedToNextTarget;

                                            if (even == 'navigateList()' || even == 'deleteFocus()') {
                                                canHotkeyProceed(elem, even, true);

                                                if (typeof proceedToNextTarget !== 'undefined') {
                                                    setTimeout(() => {
                                                       next(); 
                                                    },proceedToNextTarget)
                                                }
                                            } else {

                                                if (el.conditions.length) {

                                                    var proceed = true;

                                                    var elConditions = el.conditions.slice();

                                                    var condLength = elConditions.length; 

                                                    elConditions.forEachWithCallback((el2, i2, next2) => {
                                                        var condition = el2.split(',');
                                                            conditionElem = condition[0];
                                                            conditionFunc = condition[1];

                                                        if (conditionFunc == 'checkIfElemExisting()') {
                                                            checkIfElemExisting(conditionElem).then((success) => {
                                                                if (!success) {
                                                                    proceed = false;
                                                                }

                                                                if (condLength == i2) {
                                                                    if (proceed) {
                                                                        canHotkeyProceed(elem, even, proceed);

                                                                        if (typeof proceedToNextTarget !== 'undefined') {
                                                                            setTimeout(() => {
                                                                               next(); 
                                                                            },proceedToNextTarget)
                                                                        } 
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }

                                                                next2();
                                                            });
                                                        }

                                                        if (conditionFunc == 'checkIfElemNotExisting()') {
                                                            checkIfElemNotExisting(conditionElem).then((success) => {
                                                                if (!success) {
                                                                    proceed = false;
                                                                }

                                                                if (condLength == i2) {
                                                                    if (proceed) {
                                                                        canHotkeyProceed(elem, even, proceed);
                                                                        if (typeof proceedToNextTarget !== 'undefined') { 
                                                                            setTimeout(() => {
                                                                               next(); 
                                                                            },proceedToNextTarget)
                                                                        } 
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }

                                                                next2();
                                                            });
                                                        }

                                                        if (conditionFunc == 'checkIfElemDisabled()') {
                                                            checkIfElemDisabled(conditionElem).then((success) => {
                                                                if (!success) {
                                                                    proceed = false;
                                                                }

                                                                if (condLength == i2) {
                                                                    if (proceed) {
                                                                        canHotkeyProceed(elem, even, proceed);
                                                                        if (typeof proceedToNextTarget !== 'undefined') {
                                                                            setTimeout(() => {
                                                                               next(); 
                                                                            },proceedToNextTarget)
                                                                        }
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }

                                                                next2();
                                                            });
                                                        }

                                                        if (conditionFunc == 'checkIfElemNotDisabled()') {
                                                            checkIfElemNotDisabled(conditionElem).then((success) => {
                                                                if (!success) {
                                                                    proceed = false;
                                                                }

                                                                if (condLength == i2) {
                                                                    if (proceed) {
                                                                        canHotkeyProceed(elem, even, proceed);
                                                                        if (typeof proceedToNextTarget !== 'undefined') {
                                                                            setTimeout(() => {
                                                                               next(); 
                                                                            },proceedToNextTarget)
                                                                        }
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }

                                                                next2();
                                                            });
                                                        }

                                                        if (conditionFunc == 'checkElemLength()') {
                                                            checkElemLength(conditionElem, condition[2], condition[3]).then((success) => {
                                                                if (!success) {
                                                                    proceed = false;
                                                                }

                                                                if (condLength == i2) {
                                                                    if (proceed) {
                                                                        canHotkeyProceed(elem, even, proceed);
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }

                                                                next2();
                                                            });
                                                        }

                                                        
                                                    });

                                                } else {
                                                    canHotkeyProceed(elem, even, true);
                                                    if (typeof proceedToNextTarget !== 'undefined') {
                                                        setTimeout(() => {
                                                           next(); 
                                                        },proceedToNextTarget)
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

              
            }
        });
          
        // Clean up the event listener when the scope is destroyed
        scope.$on('$destroy', function() {
        element.off('keydown');
        });
    }
  };
});


function isInputFocused() {
  var focusedElement = document.activeElement;
  return focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA';
}

function canHotkeyProceed(elem, even, proceed) {
    if (proceed) {
        if (even == 'click') {
            $(elem).click();                                     
        } else if (even == 'navigateList()') {
            var elems = elem.split(',');
                elemsGroup = elems[0];
                elemsGroupItem = elems[1];
                elemsDirection = elems[2];

            if ($(elemsGroup).length) {
                var activeItem = $(elemsGroupItem + '.active');
                
                if (activeItem.length) {
                        // console.log(activeItem.index());
                    if (elemsDirection == 'prev') {
                        if (activeItem.index() > 0) {
                            // $(elemsGroupItem).removeClass('active');
                            // activeItem.prev().addClass('active');
                            activeItem.prev().click();
                        }
                    } else {
                        if (activeItem.index() + 1 <  $(elemsGroupItem).length) {
                            // $(elemsGroupItem).removeClass('active');
                            // activeItem.next().addClass('active');
                            activeItem.next().click();
                        }
                    }
                } else {
                    // $(elemsGroupItem).first().addClass('active');
                    $(elemsGroupItem).first().click();
                }

                var container = $(elemsGroup).parent();
                if (activeItem.length) {
                    container.animate({
                        scrollTop: (activeItem.offset().top - (activeItem.height())) - container.offset().top + container.scrollTop()
                    }, 100);
                }
            }
        }
    }
}
                                                

function checkIfElemExisting(condElem) {
    return new Promise((resolve) => {
        
        if ($(condElem).length) {
            resolve(true);
        } else {
            resolve(false);
        }
        
    });
}

function checkIfElemNotExisting(condElem) {
    return new Promise((resolve) => {
        
        if (!$(condElem).length) {
            resolve(true);
        } else {
            resolve(false);
        }
        
    });
}

function checkIfElemDisabled(condElem) {
    return new Promise((resolve) => {
        
        if ($(condElem).is(":disabled")) {
            resolve(true);
        } else {
            resolve(false);
        }
        
    });
}

function checkIfElemNotDisabled(condElem) {
    return new Promise((resolve) => {
        
        if (!$(condElem).is(":disabled")) {
            resolve(true);
        } else {
            resolve(false);
        }
        
    });
}

function checkElemLength(condElem, operator, value) {
    return new Promise((resolve) => {
        
        switch (operator) {
            case 'le':
                if ($(condElem).length <= parseInt(value)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
                break;
        }
    
    });
}

if (is_hotkeys_enabled) {
	SideButtonsManager.addButton({
	    label: 'Shortcut Key / Hotkey',
	    sections: ['register', 'transactionRoot', 'transactionEdit'],
	    handler: ['$uibModal', 'authService', function($modal, authService) {
	        var modalOptions = {
	            backdrop: 'static',
	            windowClass: 'half',
	            templateUrl: '/plugins/PLHotkeys/views/modals/index.htm',
	            controller: 'hotkeyCtrl'
	        };

	        

		        authService.checkLicense().then(function(checkLicense) {
		            if (checkLicense) {
		                $modal.open(modalOptions);
		            }
		        });

		   
	    }]
	});
}

