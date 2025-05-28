<?php
	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');


	$sql = 'UPDATE rpsods.document SET store_sid='.$_REQUEST['store_sid'].' WHERE sid = '.$_REQUEST['doc_sid'].';';

	$results = $conn->Execute($sql);
	$results = $results->GetRows();
	
    echo json_encode(['results' => $results]);
