(function(ng) {
    var dependencies = [];

    /*DO NOT MODIFY ABOVE THIS LINE!*/

    //Usage example:
    //dependencies.push('dependencyName');

    //EJOURNAL
    dependencies.push('prismPluginsSample.controller.ejournalCtrl');
    // BIR Report
    dependencies.push('birReportsCtrl');

    dependencies.push('xzOutCtrl');
    
    dependencies.push('plLogsController');

    dependencies.push('withholdingTaxCtrl');
    dependencies.push('wtaxModalCtrl');    

    dependencies.push('specialDiscountCtrl');
    dependencies.push('specialDiscountModalCtrl');
    
    dependencies.push('modifiersCtrl');
    
    dependencies.push('hotkeyCtrl');


    dependencies.push('PLVitality');
    dependencies.push('PLVitalityModalCtrl');
    dependencies.push('VitalityDiscountCtrl');
    dependencies.push('DiscountCtrl');
    dependencies.push('appliedDiscount');
    dependencies.push('noDiscount');
    dependencies.push('closeCtrl');

    dependencies.push('PL1PriceCTRL');
    dependencies.push('genderselectCTRL');



    /*DO NOT MODIFY BELOW THIS LINE!*/
    ng.module('prismApp.customizations', dependencies, null);
})(angular);
