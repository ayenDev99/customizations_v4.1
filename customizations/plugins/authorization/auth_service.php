<?php
	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	try {
		$GTILic = new COM("GTILicensingUI.Form1");
	} catch (Exception $e) {
		echo $e->getMessage() . "\n";
		echo 'exception initialising com object... terminating...';
	}

	$machineID 				= $GTILic->getMachineCodeAPI;
	$systemname 			= APPLICATION_NAME;
	$systemversion 			= APPLICATION_VERSION;

    if($_SERVER['REQUEST_METHOD'] == 'GET'):
        $action = $_GET['action'];
    elseif($_SERVER['REQUEST_METHOD'] == 'POST'):
        $postdata 	= file_get_contents("php://input");
		$request 	= json_decode($postdata);
        $action 	= $request->action;

    elseif($_SERVER['REQUEST_METHOD'] == 'PUT'):
        $putdata 	= file_get_contents("php://input");
        $request 	= json_decode($putdata);
        $action 	= $request->action;
    endif;

    switch ($action):
        case 'check_license':
            echo check_license($machineID, $systemname, $systemversion, $GTILic);
            break;
        case 'validate_license':
            echo validate_license($request, $GTILic);
            break;
    endswitch;

    /**
     * Check License Function
     * This function will serve as the utility to check current license
     * status in the system
     * @return json data;
    */
	function check_license($machineID, $systemname, $systemversion, $GTILic)
	{

		$current_license = $GTILic->checkCurrentLicenseAPI($machineID, $systemname, $systemversion);
		//echo $current_license[0] . ' '.$current_license[1] . ' '.  $current_license[2] . ' ' . $current_license[3];
		if (strtolower($current_license[0]) == "true") { // is found
			if (strtolower($current_license[3]) == "true") { // is expired
				return json_encode(array('status_code' => 0, 'isFullLicense' => 'FALSE', 'systemName' => $systemname, 'systemVersion' => $systemversion, 'machineID' => $machineID, 'systemNote' => 'License expired! Please obtain a copy of license from the system provider.'));
			} else {
				return json_encode(array('status_code' => 1, 'isFullLicense' => 'TRUE'));
			}
		} else {
			return json_encode(array('status_code' => 0, 'isFullLicense' => 'FALSE', 'systemName' => $systemname, 'systemVersion' => $systemversion, 'machineID' => $machineID, 'systemNote' => 'No license detected! Please obtain a copy of license from the system provider.'));
		}
	}

	/**
	 * Validate License Function
	 * This function will serve as the utility to validate
	 * new license data from the user input
	 * @return json data;
	*/
	function validate_license($request, $GTILic)
	{
		$result = $GTILic->applyLicenseKeyAPI($request->licenseKey, $request->machineID, $request->systemName, $request->systemVersion);

		if ($result[0] == "true") {
			return json_encode(array('status_code' => 200, 'status_header' => 'OK', 'status_message' => 'License key has been accepted!'));
		} else {
			return json_encode(array('status_code' => 400, 'status_header' => 'Bad Request', 'status_message' => 'Invalid license key!'));
		}
	}