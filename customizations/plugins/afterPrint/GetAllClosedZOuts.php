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


	$sql = 'SELECT
			*
		FROM
			zout_control A
		WHERE
			A.status = 3 AND
			(A.report_type = 2 OR A.report_type = 3)
		';

	if (isset($request->fromDate) && isset($request->toDate)) {
		$from = $request->fromDate;
        $to = $request->toDate;
        $sql .= ' AND DATE_FORMAT(A.period_begin, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\'';
	}

	// print_r($request);

	$results = $conn->Execute($sql);
	$results = $results->GetRows();
	
    echo json_encode(['results' => $results]);