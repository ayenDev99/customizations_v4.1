
var config_isXoutPreviewEnabled 			= true;
var config_isZoutPreviewEnabled 			= true;

var config_settingsVersion_receipts			= "v3";
var config_settingsVersion_xzout			= "v3";
var config_settingsVersion_reports			= "v3";

var config_docDesign_regular_trans_v2 			= "";
var config_docDesign_regular_reprint_trans_v2 		= "";
var config_docDesign_return_trans_v2 			= "";
var config_docDesign_return_reprint_trans_v2 		= "";
var config_docDesign_XOUT_v2				= "";
var config_docDesign_ZOUT_v2				= "";

var config_docDesign_regular_trans_v3 			= "TobysRegular3";
var config_docDesign_regular_reprint_trans_v3 		= "TobysReprint";
var config_docDesign_return_trans_v3 			= "TobysRegular3";
var config_docDesign_return_reprint_trans_v3 		= "TobysReprint";
var config_docDesign_XOUT_v3				= "XOut";
var config_docDesign_ZOUT_v3				= "ZOut";

var config_isSOPluginEnabled				= false;

var config_isNetAmountRoundingOffEnabled		= false;

// Witholding Tax
var config_enable_auto_compute_wtax			= true;
var config_wtax_min_perc				= 1;
var config_wtax_max_perc				= 5;
var config_wtax_perc_divisibility			= 1;

// Special Discounts
var config_enable_special_discounts			= true;
var config_special_discount_process_type 		= 'default'; // pharma, restaurant or default
var config_special_discount_restaurant_max_cust 	= 10; // max sc/pwd customer count

var config_enable_special_discount_sc			= true;
var config_special_discount_sc_cust_udf			= 18;
var config_special_discount_sc_perc			= 20;
var config_special_discount_sc_limit			= 0; // limitation per customer per week
	
var config_enable_special_discount_pwd			= true;
var config_special_discount_pwd_cust_udf		= 18;
var config_special_discount_pwd_perc			= 20;
var config_special_discount_pwd_limit			= 0; // limitation per customer per week

var config_enable_special_discount_athlete		= true;
var config_special_discount_athlete_cust_udf		= 18;
var config_special_discount_athlete_perc		= 20;
var config_special_discount_athlete_limit		= 0; // limitation per customer per week

var config_enable_special_discount_solo_parent		= false;
var config_special_discount_solo_parent_cust_udf	= 18;
var config_special_discount_solo_parent_perc		= 10;
var config_special_discount_solo_parent_limit		= 0; // limitation per customer per week

var config_special_discount_percentage_card_name	= '';
var config_special_discount_employee_10_coupon_name	= '';
var config_special_discount_employee_20_coupon_name	= '';

// Open drawer blocking - zout
var config_isOpenDrawerBlockingEnabled = false;

// Open drawer validation - new transaction
var config_openDrawerValidationEnabled = false;

// Document sequence - tracking no
var config_isDocSequencePluginEnabled = false;

// Shortcut Keys/Hotkeys
var is_hotkeys_enabled = false;

// Document sequence - skipping invoice sequence correction
var is_skipping_invoice_correction_enabled = false;
var is_skipping_invoice_correction_alert_enabled = false;

// Lot number assignment
var config_lotAssignmentPluginsEnabled 	= false;

// Quick Search
var config_lookUpFields_ListHeader          = ['Barcode', 'Item Name', 'Quantity', 'Price']; /*Renaming of HEADER in lookupItem Table*/
var config_lookUpFields_ListToDisplay       = ['alu', 'description1', 'qty', 'price']; /*Lookup fields list, Fields to Display in User Interface*/
var config_lookUpMaxDisplayedResultCount 	= 22; /*Max items to display*/

var config_quickSearchEnabled 			  = false; /*Enable/Disable Quick Search plugin*/
var config_lookUpFields_ListToQuery       = 'a.alu, a.description1, b.qty, price, udf6_string, udf7_string, udf8_string'; /*Fields to get in database and filtering, must use alias*/
var config_lookUpOrderBy 			      = 'a.description1 ASC'; /*Fields that need in (Order by), can be set as ASC or DESC*/

// QTS
var is_prism_qts_plugin_enabled = false;
var is_prism_qts_queing_enabled = false;
var is_prism_qts_manual_queing_enabled = false;
var qts_delivery_tansaction_types = ['Grab-2', 'Food Panda-3']; // Type Name - Price Level
var modifierOptionsAlu = "MODIFIER"; // Where item to lookup
var modifiers1Options = ['Less Sugar', 'Less Ice', 'Add Milk', 'Add coffee'];
var modifiers2Options = ['test', 'test2', 'test3', 'test4'];
var modifier1Text1NoteNo = 6;
var modifier1Text2NoteNo = 7;
var modifier2Text3NoteNo = 8;
var modifier2Text4NoteNo = 9;
var modifier3NoteNo = 10;
var modifierPriceLevel = 0; // Modifiers with price

var is_1to1_auto_print_enabled = false;
var docDescign_qts_1to1_design_name = '';
var docDescign_qts_1to1_resource_name = 'DOCUMENT';
var is_1toAll_auto_print_enabled = false;
var docDescign_qts_1toAll_design_name = '';
var docDescign_qts_1toAll_resource_name = 'DOCUMENT';


var qts_printers = {
	'POS1': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'POS2': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'POS3': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'desktop-cc66sdt_8080': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'desktop-cc66sdt_8081': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'desktop-cc66sdt_8082': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	},
	'desktop-cc66sdt_8083': {
		'1to1': 'CUP105',
		'1toAll': 'BARISTA104'
	}
	
}
// workstation_name -> 1to1 -> printer_name
// workstation_name -> 1toAll -> printer_name
var cd_packaged_item_display = 'package_only'; // all, component_only, package_only
 var price_level_no = 1; //AIA Price level computation based
