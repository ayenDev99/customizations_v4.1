var app = angular.module('customDirectives', []);
app.directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});

app.directive('lettersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^a-zA-Z\s]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});

app.directive('salesSummary', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-sales-summary.htm"
    };
});

app.directive('detailedSummary', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-detailed-sales-summary.htm"
    };
});

app.directive('returnReport', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-return-report.htm"
    };
});

app.directive('seniorCitizensDiscount', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-senior-citizens-discount.htm"
    };
});

app.directive('pwdDiscount', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-pwd-discount.htm"
    };
});

app.directive('spDiscount', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-sp-discount.htm"
    };
});

app.directive('athleteDiscount', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-athlete-discount.htm"
    };
});

app.directive('zeroRated', function () {
    return {
        restrict: 'E',
        // link: function (scope, element, attrs, ngModelCtrl) {
        //
        // },
        templateUrl: "plugins/templates/components/bir-zero-rated.htm"
    };
});