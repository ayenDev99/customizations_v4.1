<?php
    date_default_timezone_set('Asia/Manila'); //TIMEZONE
    require_once('../../libraries/adodb5/adodb.inc.php');
    session_start();
    $conn = NewADOConnection('sqlite3');
    $conn->PConnect('ejournal_db.db');
    $request_url = '';
    $request_method = 'GET';
    $request_content = '';

    if($_REQUEST['printtype'] != 5 AND $_REQUEST['printtype'] != 6):
        $request_url = $_SERVER['HTTP_ORIGIN'] . "/v1/rest/document/transform/".$_REQUEST['design']."?filter=(SID,eq,".$_REQUEST['sid'].")&type=preview&sort=item.ENHANCED_ITEM_POS,desc";
    else:
        $request_url = $_SERVER['HTTP_ORIGIN'] . "/v1/rpc";
        $request_method = 'POST';
        $request_content = json_encode($_REQUEST['content']);
    endif;

    $curl = curl_init();
    $var = "";
    curl_setopt ($curl, CURLOPT_CAINFO, dirname(__FILE__)."/customizations/plugins/afterPrint/cacert.pem");

    curl_setopt_array($curl, array(
     CURLOPT_URL => $request_url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_SSL_VERIFYHOST => 0, //NEED TO REMOVE THIS AFTER DEPLOYMENT OF LIVE
      CURLOPT_SSL_VERIFYPEER => 0, //NEED TO REMOVE THIS AFTER DEPLOYMENT OF LIVE
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => $request_method,
      CURLOPT_POSTFIELDS => $request_content,
      CURLOPT_HTTPHEADER => array(
        "accept: application/json",
        "content-type: application/json; charset=UTF-8",
        "Auth-Session: ".$_REQUEST['auth']
      ),

    ));

    $err = curl_error($curl);
    $header = curl_getinfo($curl);
    $responseA = curl_exec($curl);
    $transform_design = json_decode($responseA, true);
//print_r($responseA);
//print_r($request_url);
    if ($_REQUEST['printtype'] == 5 || $_REQUEST['printtype'] == 6) {
        if (isset($transform_design[0]['params'])) {
            if (isset($transform_design[0]['params']['result'])) {
                echo json_encode(['success' => true, 'contain' => $transform_design[0]['params']['result']]);
            } else {
                $err = json_decode($transform_design[0]['params']['errors'])[0];
                echo json_encode(['success' => false, 'message' => $err->errormsg]);
            }
        } else {
            $err = json_decode($transform_design[0]['params']['errors'])[0];
            echo json_encode(['success' => false, 'message' => $err->errormsg]);
        }
    } else {
        if ($_REQUEST['receiptType'] == 'regular' || $_REQUEST['receiptType'] == 'return') {
            $sql = "SELECT count(*) AS cnt FROM tbl_ejournals WHERE type = 'document' AND sid = '".$_REQUEST['sid']."'";
        } else {
            $sql = "SELECT count(*) AS cnt FROM tbl_ejournals WHERE type = 'document' AND sid = '".$_REQUEST['sid']."_reprint'";
        }
        
        // $conn->debug = true;
        $rsResult = $conn->Execute($sql);
        // print_r($rsResult);
        if (!$rsResult->EOF){
            if ($rsResult->fields['cnt'] == 0) {
                $postDate = date('Y-m-d H:i:s', strtotime($_REQUEST['datefrom']));
                $sql = "INSERT INTO 
                            tbl_ejournals 
                            (sid, type, transaction_type, created_date, store_sid, ws_sid, receipt_type, contain)
                        VALUES
                            ('" . $_REQUEST['sid'] . "',
                            'document',
                            '" . $_REQUEST['transactionType'] . "',
                            '" . $postDate . "',
                            '" . $_REQUEST['store'] . "',
                            '" . $_REQUEST['workstation'] . "',
                            '" . $_REQUEST['receiptType'] . "',
                            '" . $transform_design[0]['payload'] ."')";

                $conn->Execute($sql);
                $conn->close();

                echo json_encode(['success' => true, 'contain' => $transform_design[0]['payload']]);
                return;
            } else {
                $sid = $_REQUEST['sid'];
                $payload = $transform_design[0]['payload'];
                $sql = "UPDATE tbl_ejournals SET contain = '$payload' WHERE sid = '$sid'";

                $conn->Execute($sql);
                $conn->close();

                echo json_encode(['success' => true, 'message' => 'document has already been stored', 'contain' => $transform_design[0]['payload']]);
                return;    
            }
        }

        echo json_encode(['success' => false, 'message' => 'document has already been stored']);
        return;
    }


?>
