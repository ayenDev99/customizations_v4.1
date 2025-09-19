<?php
    require_once('../../libraries/adodb5/adodb.inc.php');

    $conn = NewADOConnection('sqlite3');
    $conn->PConnect('C:\ProgramData\RetailPro\Server\WebClient\customizations\plugins\afterPrint\ejournal_db.db');
    $postdata 	= file_get_contents("php://input");
    $request 	= json_decode($postdata);

    $date = $_GET['date'];
    if ($date == 'all') {
        $sql = "SELECT strftime('%Y-%m-%d', created_date) as date, * FROM tbl_ejournals ORDER BY CASE WHEN 
	type = 'document' then 1
    else 2
    END
    ,`created_date` ASC";
    } else {
        $sql = "SELECT strftime('%Y-%m-%d', created_date) as date, * FROM tbl_ejournals WHERE strftime('%Y-%m-%d', created_date) = '" . $date . "' ORDER BY CASE WHEN 
	type = 'document' then 1
    else 2
    END
    ,`created_date` ASC";
    }

    $rsResult = $conn->Execute($sql);

// echo "<pre>";
//	print_r($rsResult);
//	echo "</pre>"; exit;

    $arr = [];

    while(!$rsResult->EOF){
        // $arr[$ctr]['contain'] = $rsResult->fields['contain'];
        // $arr[$ctr]['print_type'] = $rsResult->fields['el_printtype'];
        $date = $rsResult->fields['date'];
        $storeSid = $rsResult->fields['store_sid'];
        if (!isset($arr[$storeSid])) {
            $arr[$storeSid] = [];
        }

        $arr[$storeSid][] = [
            'date' => $date,
            'type' => $rsResult->fields['type'],
            'contain' => $rsResult->fields['contain']
        ];

        // $arr[$date][] = $rsResult->fields['contain'];
        $rsResult->MoveNext();
    }

    $arr2 = [];
    foreach ($arr as $store => $ar) {
        foreach ($ar as $key => $value) {
            if (!isset($arr2[$store.$value['date']])) {
                $arr2[$store.$value['date']] = [];
                $arr2[$store.$value['date']][] = $store;
                $arr2[$store.$value['date']][] = $value['date'];
            }

            $arr2[$store.$value['date']][] = [
                'contain' => $value['contain'],
                'type' => $value['type']
            ];
        }
        
    }

    $temp = [];
    foreach ($arr2 as $key => $arr) {
        $temp[] = $arr;
    }

	//echo "<pre>";
	//print_r($arr);
	//echo "</pre>"; exit;
    header( 'Content-Type: application/json');
    echo json_encode($temp);
?>
