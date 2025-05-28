<?php
	date_default_timezone_set('Asia/Manila');

	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	if (!$conn_qts) {
		header('HTTP/1.1 500 Internal Server Booboo');
        header('Content-Type: application/json; charset=UTF-8');
        return;
	}

	$payload = (isset($_REQUEST['payload'])) ? $_REQUEST['payload'] : $_POST['payload'] ;
	$data = json_decode($payload, true);

	$queueID = generateUniqueNumber($conn_qts, $data['lastId']);

	$datetime = date('Y-m-d H:i:s');

	$docSid = $data['docSid'];

	$isScheduled = $data['isScheduled'];
	$pos_flag2 = $data['pos_flag2'];
	$receipt_type = $data['receipt_type'];
	$modifier1NoteNo = $data['modifier1NoteNo'];
	$modifier2NoteNo = $data['modifier2NoteNo'];
	$modifier3NoteNo = $data['modifier3NoteNo'];

	// Construct the SQL query
	if ($receipt_type == 2) {
		$query = "INSERT INTO orders (DOC_SID, QUEUE_ID, STATUS, IS_SCHEDULED, POS_FLAG2, DELIVERY_DATETIME, CREATED_DATETIME, MODIFIED_DATETIME) VALUES ('$docSid', '$queueID', '1', '$isScheduled', '$pos_flag2', '$datetime', '$datetime', '$datetime')";
	} else {
		$query = "INSERT INTO orders (DOC_SID, QUEUE_ID, STATUS, IS_SCHEDULED, POS_FLAG2, CREATED_DATETIME, MODIFIED_DATETIME) VALUES ('$docSid', '$queueID', '1', '$isScheduled', '$pos_flag2', '$datetime', '$datetime')";
	}
	// echo "$query";
	$result = $conn_qts->Execute($query);

	$orderId = $conn_qts->Insert_ID();

	foreach($data['items'] as $item) {
		$docItemSid = $item['sid'];
		$invnSbsItemSid = $item['invn_sbs_item_sid'];
		$description1 = $item['description1'];
		$modifier1 = $item['modifier1'];
		$modifier2 = $item['modifier2'];
		$modifier3 = $item['modifier3'];

		$query = "INSERT INTO order_items (ORDER_ID, DOC_ITEM_SID, INVN_SBS_ITEM_SID, DESCRIPTION1, STATUS, MODIFIER1, MODIFIER2, MODIFIER3, CREATED_DATETIME, MODIFIED_DATETIME) VALUES ('$orderId', '$docItemSid', '$invnSbsItemSid', '$description1', '1', '$modifier1', '$modifier2', '$modifier3', '$datetime', '$datetime')";
		$result = $conn_qts->Execute($query);
	}

	echo $queueID;

	function generateUniqueNumber($conn_qts, $lastId) {
	    $isUnique = false;
	    
	    while (!$isUnique) {
	        // Generate a new number
	        $lastId = $lastId + 1;
	        
	        // Check if the number already exists in the database
	        $query = "SELECT COUNT(*) AS count FROM orders WHERE QUEUE_ID = '$lastId'";
	        $result = $conn_qts->Execute($query);
	        
	        // Check if the query was successful
	        if ($result) {
	            $rowCount = $result->fields['count'];
	            
	            // If the number does not exist in the database, set isUnique to true
	            if ($rowCount == 0) {
	                $isUnique = true;
	            }
	        }
	    }
	    
	    return $lastId;
	}
?>