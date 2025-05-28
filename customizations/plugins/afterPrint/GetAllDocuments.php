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
			document A
		WHERE
			A.status = 4';

	if (isset($request->fromDate) && isset($request->toDate)) {
		$from = $request->fromDate;
        $to = $request->toDate;
        $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\'';
	}

	$results = $conn->Execute($sql);
	$results = $results->GetRows();
	
    echo json_encode(['results' => $results]);