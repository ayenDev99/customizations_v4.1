<?php
    require_once('../../libraries/adodb5/adodb.inc.php');

    $conn = NewADOConnection('sqlite3');
    $conn->PConnect('C:\ProgramData\RetailPro\Server\WebClient\customizations\plugins\afterPrint\ejournal_db.db');
    $postdata 	= file_get_contents("php://input");
    $request 	= json_decode($postdata);
    $sql = "SELECT * FROM tbl_ejournals WHERE ".$request->filter." ORDER BY `created_date` ASC";

    $rsResult = $conn->Execute($sql);
    $ctr = 0;
    $arr = [];

    while(!$rsResult->EOF){
        $arr[$ctr]['contain'] = $rsResult->fields['contain'];
        // $arr[$ctr]['print_type'] = $rsResult->fields['el_printtype'];
        $rsResult->MoveNext();
        $ctr++;
    }
	//echo "<pre>";
	//print_r($arr);
	//echo "</pre>"; exit;
    header( 'Content-Type: application/json');
    echo json_encode($arr);
?>
