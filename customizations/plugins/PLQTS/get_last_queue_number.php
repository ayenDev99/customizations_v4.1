<?php
	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	if (!$conn_qts) {
		header('HTTP/1.1 500 Internal Server Booboo');
        header('Content-Type: application/json; charset=UTF-8');
        return;
	}

	$query = "SELECT MAX(QUEUE_ID) AS last_id FROM orders";

	$result = $conn_qts->Execute($query);

	// Check if the query was successful
	if ($result) {
	    // Retrieve the last ID
	    $lastId = $result->fields['last_id'];
	    
	    echo $lastId;
	} else {
		http_response_code(500);
	    echo "Error executing query: " . $conn_qts->ErrorMsg();
	}

	// Close the ADOdb conn_qtsection
	$conn_qts->Close();