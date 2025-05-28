<?php
	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $request = file_get_contents('php://input');
        $request = json_decode($request);
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $request = (object) $_GET;
    }

	switch ($request->action) {
		case 'checkRecupdate':
			echo checkRecupdate();
			break;

		case 'closeDrawerDumping':
			echo closeDrawerDumping($request);
			break;

		case 'perTransactionDumping':
			echo perTransactionDumping($request);
			break;
	}

	function checkRecupdate()
	{
		$success = !DUMPING_CHECK_RECUPDATE_ENABLE;

		if (DUMPING_CHECK_RECUPDATE_ENABLE) {
			$ini_array = parse_ini_file(DUMPING_RECUPDATE_PATH);

			if (isset($ini_array['ZDATE'])) {

				$recupdateDATE = $ini_array['ZDATE'];
				$recupdateDATE = DateTime::createFromFormat('mdY', $recupdateDATE);
				$recupdateDATE = $recupdateDATE->format('Y-m-d');

				$d = new DateTime();
				$yesterdayDATE = $d->sub(new DateInterval('P1D'));
				$yesterdayDATE = $d->format('Y-m-d');

				if (strtotime($recupdateDATE) >= strtotime($yesterdayDATE)) $success = true;
			}
		}

		echo json_encode(['success' => $success]);
	}

	function closeDrawerDumping($request)
	{
		if (DUMPING_CLOSE_DRAWER_ENABLE) {
			putenv('PATH=' . DUMPING_PATH);
			echo DUMPING_EXE . ' SBS_No=' . $request->subsidiaryNo . ' method=closedrawer';
			$output = shell_exec(DUMPING_EXE . ' SBS_No=' . $request->subsidiaryNo . ' method=closedrawer');
		}
		
	}

	function perTransactionDumping($request)
	{
		if (DUMPING_PER_TRANSACTION_ENABLE) {
			putenv('PATH=' . DUMPING_PATH);
			echo DUMPING_EXE . ' SBS_No=' . $request->subsidiaryNo . ' INVC_SID=' . $request->docSID;
			$output = shell_exec(DUMPING_EXE . ' SBS_No=' . $request->subsidiaryNo . ' INVC_SID=' . $request->docSID);
		}
		
	}