<?php
    require_once('../../libraries/adodb5/adodb.inc.php');
    require_once('../../config/gticonfig.php');
    date_default_timezone_set('Asia/Manila'); //TIMEZONE
    require_once('../../libraries/escpos-php/autoload.php');
    use Mike42\Escpos\Printer;
    use Mike42\Escpos\EscposImage;
    use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
    use Mike42\Escpos\CapabilityProfile;

    $filename = "xoutzout.png";

    $conn = NewADOConnection('sqlite3');
    $conn->PConnect('../afterPrint/ejournal_db.db');

    if($_SERVER['REQUEST_METHOD'] == 'POST'):
        $postdata   = file_get_contents("php://input");
        $request    = json_decode($postdata);
        switch ($request->action):
            case 'exportReceipt':
                echo exportReceipt($request);
                break;
            case 'exportXOutZOut':
                echo exportXOutZOut($request, $conn);
                break;
            case 'printXOutZOut':
                echo printXOutZOut($request, $filename, $printerSetup);
                break;
        endswitch;
    endif;

    function strpos_array($haystack, $needle, $offset=0) {
        if(!is_array($needle)) $needle = array($needle);
        foreach($needle as $query) {
            if(strpos($haystack, $query, $offset) !== false) return true; // stop on first true result
        }
        return false;
    }

    function printXOutZOut($request, $filename, $printerSetup) 
    {
        $printer_path = null;

        if (isset($printerSetup[$request->port])) {
            $printer_path = $printerSetup[$request->port];
        } else {
            $printer_path = $printerSetup['default'];
        }

        $profile = CapabilityProfile::load("simple");
        $connector = new WindowsPrintConnector($printer_path);
        $printer = new Printer($connector, $profile);

        $created_date = $request->data->created_dateTime;
        $ws_no = $request->data->filters->workstationNo;
        $from_date = $request->data->filters->fromDate;
        $to_date = $request->data->filters->toDate;
        $z_count = $request->data->z_count;

        if ($request->data->print_type == '6') {
            $txtFilesPath = '../ZOut';
            $filePath = $txtFilesPath . '/' . date_format(date_create($created_date), 'YmdHis') . '-WS' . $ws_no . '-Z' . $z_count . '.txt';
        } 
        else if (($request->data->print_type == '5')) {
            $txtFilesPath = '../XOut';
            $filePath = $txtFilesPath . '/' . date_format(date_create($created_date), 'YmdHis') . '-WS' . $ws_no . '-X-' . date('mdY', strtotime($from_date)) . '-' . date('mdY', strtotime($to_date)) . '.txt';
        }

        // Check if the file exists
        if (file_exists($filePath)) {
            // Get the file contents
            $content = file_get_contents($filePath);

            // Print the file contents
            $printer->text($content);
        } else {
            echo "File not found: $filePath";
        }

        $printer->feed(10);
        $printer->cut();
        $printer->close();
    }

    // Method use to export receipt data to text file with the same format or style
    function exportReceipt($request) {

        if ($request->exportType == 'summary') {
            $txtFilesPath = '../BIREjournals';
            if (!file_exists($txtFilesPath)) {
                mkdir($txtFilesPath, 0777, true);
            }

            $filePath = $txtFilesPath . '/' . $request->storeName . '-'.date('Y-m-d') . '.txt';

            if (isset($request->date)) {
                $filePath = $txtFilesPath . '/' . $request->storeName . '-' . $request->date . '.txt';
            }
        } else if ($request->exportType == 'perTransaction') {
            $txtFilesPath = '../perTransaction';
            if (!file_exists($txtFilesPath)) {
                mkdir($txtFilesPath, 0777, true);
            }

            if (!file_exists($txtFilesPath . '/' . date('Ymd'))) {
                mkdir($txtFilesPath . '/' . date('Ymd'), 0777, true);  
            }
            $txtFilesPath .= '/' . date('Ymd'); 
            
            if (!file_exists($txtFilesPath . '/receipts')) {
                mkdir($txtFilesPath . '/receipts', 0777, true);  
            }
            $txtFilesPath .= '/receipts'; 

            $filePath = $txtFilesPath . '/' . str_pad($request->docNo,10,"0",STR_PAD_LEFT) . '_' . date('Y-m-d_H-i-s', strtotime($request->created_dateTime)) . '.txt';

        } else {
            die('Error! Indicate the export type on the request.');
        }

        // print_r($request->data);
        // die();

        $file = fopen($filePath,'w');
        $width = 40;
        foreach ($request->data as $key => $value):
            $y_point = 0;
            $x_point = 0;
            $sub_value_prev = '';
            $data_array = array();
            $width_px = $width / $value->width;
            $space_count = 0;
            foreach ($value->content as $sub_key => $sub_value):
                if(strpos($sub_value->data, '<br>') !== FALSE):
                    $exploded = explode('<br>', $sub_value->data);
                    if(count($exploded) > 0):
                        $exploded_value_data = '';
                        foreach ($exploded as $exploded_key => $exploded_value):
                            $space_count = ($width - strlen($exploded_value)) / 2;
                            $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                            $space = '';
                            for($i=0; $i < $space_count; $i++):
                                $space .= ' ';
                            endfor;
                            $exploded_value_data .= $space.$exploded_value.PHP_EOL;
                        endforeach;
                        $sub_value->data = $exploded_value_data;
                    endif;
                endif;

                $space = '';
                if($y_point == 0 AND $x_point == 0):
                    array_push($data_array, $sub_value->data);
                    // $sub_value_prev .= $sub_value->data;
                else:
                    // Next word with next line
                    if($sub_value->y > $y_point):

                        // For identifying columns in receipt
                        $data_array = array_values(array_filter($data_array, 'strlen'));
                        switch (count($data_array)):
                            case 1:
                                if($x_point < 100):
                                    $space_count = ($width - strlen($data_array[0])) / 2;
                                else:
                                    $space_count = ($width - strlen($data_array[0]));
                                endif;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                                for($i=0; $i < $space_count; $i++):
                                    $space .= ' ';
                                endfor;

                                $array_keyword = array('ITEMS',
                                                        'DOLLARS',
                                                        'FEES',
                                                        'PAYMENT MODE',
                                                        'VAT',
                                                        'MINUS',
                                                        'NET VALUES',
                                                        'CUSTOMER NAME:',
                                                        'TIN:',
                                                        'ADDRESS:',
                                                        'RETURN SLIP #:',
                                                        'DATE AND TIME:',
                                                        'REF. SI #:',
                                                        'CASHIER:',
                                                        'SALES INVOICE #:',
                                                        'DATE:',
                                                        'SUBTOTAL:',
                                                        'DISCOUNT:',
                                                        'CASH',
                                                        'TOTAL AMOUNT DUE:',
                                                        'VATABLE SALES:',
                                                        'VAT AMOUNT:',
                                                        'VAT-EXEMPT SALES:',
                                                        'ZERO-RATED SALES:',
                                                        'TOTAL SALE:',
                                                        'BUS. NAME/STYLE:',
                                                        'SALES',
                                                        'SODEP',
                                                        'SHIPPING',
                                                        'TOTAL',
                                                        'INVOICE COUNTS',
                                                        'FEE',
                                                        '# OF TRANS:',
                                                        'CLOSED BY:',
                                                        'STORE NAME:',
                                                        'STORE CODE:',
                                                        'SUBSIDIARY:',
                                                        'WORKSTATION:',
                                                        'CASHIER(S):',
                                                        'DRAWER:',
                                                        'TILL:',
                                                        '# OF TRANSACTIONS:',
                                                        'OPEN DATE/TIME:',
                                                        'CLOSE DATE/TIME:',
                                                        'PAID IN:',
                                                        'PAID OUT:',
                                                        'BEGIN:',
                                                        'NET:',
                                                        'COUNT:',
                                                        'OVER:',
                                                        'LEAVE:',
                                                        'DEPOSIT:',
                                                        'DATE RANGE:',
                                                        'POS TERMINAL NO:'
                                                    );
                                if(strpos(strtoupper($data_array[0]), '*** SALES INVOICE ***') !== FALSE OR strpos(strtoupper($data_array[0]), '*** RETURN ***') !== FALSE OR strpos(strtoupper($data_array[0]), '* Z-READING *') !== FALSE OR strpos(strtoupper($data_array[0]), '* X-READING *') !== FALSE):
                                    fwrite($file, PHP_EOL.$space.$data_array[0].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NAME/STYLE') !== FALSE):
                                    fwrite($file, $data_array[0].PHP_EOL.PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NET OF VAT') !== FALSE):
                                    fwrite($file, PHP_EOL.$space.$data_array[0].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'DISCOUNTED PRICE') !== FALSE):
                                    fwrite($file, $space.$data_array[0].PHP_EOL);
                                elseif(in_array(strtoupper($data_array[0]), $array_keyword)):
                                    fwrite($file, $data_array[0].PHP_EOL);
                                else:
                                    fwrite($file, $space.$data_array[0].PHP_EOL);
                                endif;

                                $space = '';
                                break;
                            case 2:
                                end($data_array);
                                
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1]);
                                if(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE OR strpos(strtoupper($data_array[1]), 'ITEMS SOLD') !== FALSE AND count(explode('/', $data_array[0])) != 3):
                                    $space_count = (40 - $str_length) / 2;
                                elseif(strpos(strtoupper($data_array[0]), 'SUBTOTAL:') !== FALSE OR strpos(strtoupper($data_array[0]), 'DISCOUNT:') !== FALSE):
                                    $space_count = (40 - $str_length) - 2;
                                else:
                                    $space_count = (40 - $str_length);
                                endif;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_DOWN);
                                if($space_count < 40):
                                    for($i=0; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;



                                if(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE):
                                    fwrite($file, $space.' '.$data_array[0].$space.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE):
                                    fwrite($file, $space.$data_array[0].' '.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NAME/STYLE') !== FALSE):
                                    fwrite($file, $data_array[0].$space.$data_array[1].PHP_EOL.PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'SUBTOTAL:') !== FALSE OR strpos(strtoupper($data_array[0]), 'DISCOUNT:') !== FALSE):
                                    fwrite($file, $space.$data_array[0].'  '.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'ENDING RETURN') !== FALSE):
                                    $spaces = '';
                                    $spaceCnt = 40 - $str_length;
                                    for($i = 1; $i <= $spaceCnt; $i++) {
                                        $spaces .= ' ';
                                    }

                                    fwrite($file, $data_array[0].$spaces.$data_array[1].PHP_EOL);
                                    fwrite($file, ' ' . PHP_EOL);
                                    fwrite($file, ' ' . PHP_EOL);
                                // elseif($value->print_type == 6 AND strpos(strtoupper($data_array[0]), 'CASH FLOW TOTAL:') !== FALSE):
                                //     fwrite($file, $data_array[0].$space.$space.$data_array[1].PHP_EOL);
                                // elseif($value->print_type == 6 AND count(explode('/', $data_array[0])) != 3):
                                //     fwrite($file, $space.$data_array[0].$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'DATE RANGE:') !== FALSE OR strpos(strtoupper($data_array[0]), 'POS TERMINAL NO:') !== FALSE):
                                    fwrite($file, $space.$data_array[0].' '.$data_array[1].PHP_EOL);
                                else:
                                    $spaces = '';
                                    $spaceCnt = 40 - $str_length;
                                    for($i = 1; $i <= $spaceCnt; $i++) {
                                        $spaces .= ' ';
                                    }

                                    fwrite($file, $data_array[0].$spaces.$data_array[1].PHP_EOL);
                                endif;

                                break;
                            case 3:
                                end($data_array);
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1].$data_array[2]);
                                $space_count = (40 - $str_length) /2;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_DOWN);
                                if($space_count < 40):
                                    for($i=0; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;
                                fwrite($file, $data_array[0].$space.$data_array[1].$space.$data_array[2].PHP_EOL);
                                break;
                            case 4:
                                end($data_array);
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1].$data_array[2].$data_array[3]);
                                $space_count = (40 - $str_length) /3;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                                if($space_count < 40 ):
                                    for($i=1; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;
                                fwrite($file, $data_array[0].$space.$data_array[1].$space.$data_array[2].$space.$data_array[3].PHP_EOL);
                                break;
                            case 5:
                                end($data_array);
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1].$data_array[2].$data_array[3].$data_array[4]);
                                $space_count = (40 - $str_length) /4;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                                if($space_count < 40 ):
                                    for($i=1; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;
                                fwrite($file, $data_array[0].$space.$data_array[1].' '.$data_array[2].$space.$data_array[3].$space.$data_array[4].PHP_EOL);
                                break;
                        endswitch;

                        $sub_value_prev = '';
                        $data_array = array();
                        if($sub_key == count($value->content) - 1):
                            $space = '';
                            $space_count = ($width - strlen($sub_value->data)) / 2;
                            // $space_count = $width_px * $sub_value->x;
                            $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                            for($i=0; $i < $space_count; $i++):
                                $space .= ' ';
                            endfor;
                            fwrite($file, $space.$sub_value->data.PHP_EOL.PHP_EOL);
                        else:
                            array_push($data_array, $sub_value->data);
                            // $sub_value_prev .= $sub_value->data;
                        endif;
                    // Next word with the same line
                    elseif($sub_value->y == $y_point OR $sub_value->y < ($y_point + 5)):
                        array_push($data_array, $sub_value->data);
                        // $sub_value_prev .= $space.$sub_value->data;
                    endif;
                endif;
                $y_point = $sub_value->y;
                $x_point = $sub_value->x;
            endforeach;
        endforeach;
        fclose($file);
        $data = file_get_contents($filePath);
        $base64 = base64_encode($data);

        // if ($request->exportType == 'summary') {
            // do {
            //     unlink($filePath);
            // } while (file_exists($filePath));
        // } 
    
        echo json_encode(array('status_code' => 200, 'filename' => 'BIR-EJOURNAL-SUMMARY-'.date('YmdHis') . '.txt', 'data' => $base64, 'type' => 'TXT'));
    }

    function exportXOutZOut($request, $conn) {
      
        if ($request->exportType == 'zout') {

            $sql = "SELECT count(*) AS cnt FROM tbl_ejournals WHERE type = 'zout' AND sid = '".$request->sid."'";
            // $conn->close();
            // $conn->debug = true;
            $rsResult = $conn->Execute($sql);
            // print_r($rsResult);
            if (!$rsResult->EOF){
                if ($rsResult->fields['cnt'] == 0) {
                    $postDate = date('Y-m-d H:i:s', strtotime($request->created_dateTime));
                    $sql = "INSERT INTO 
                                tbl_ejournals 
                                (sid, type, transaction_type, created_date, store_sid, ws_sid, receipt_type, contain)
                            VALUES
                                ('" . $request->sid . "',
                                'zout',
                                '',
                                '" . $postDate . "',
                                '" . $request->storeSid . "',
                                '" . $request->workstation . "',
                                '',
                                '" . $request->contain."')";

                    $conn->Execute($sql);
                    $conn->close();
                }
            }

            $txtFilesPath = '../ZOut';
        } else {
            $txtFilesPath = '../XOut';
        }
     

        if (!file_exists($txtFilesPath)) {
            mkdir($txtFilesPath, 0777, true);
        }

        // echo "<pre>";
        // print_r($request);
        // echo "</pre>";
        // die();
        // exit();

        if ($request->exportType == 'zout') {
            $filePath = $txtFilesPath . '/' . date_format(date_create($request->created_dateTime), 'YmdHis') . '-WS' . $request->workstationNo . '-Z' . $request->zcount . '.txt';
        } else {
            $filePath = $txtFilesPath . '/' . date_format(date_create($request->created_dateTime), 'YmdHis') . '-WS' . $request->workstationNo . '-X-' . date('mdY', strtotime($request->fromDate)) . '-' . date('mdY', strtotime($request->toDate)) . '.txt';
        }

       
        // $filePath = $txtFilesPath . '/' . date('YmdHis') . '-WS' . $request->workstationNo . '-Z' . $request->zcount . '.txt';
        

        $file = fopen($filePath,'w');
        $width = 40;

        foreach ($request->data as $key => $value):
            $y_point = 0;
            $x_point = 0;
            $sub_value_prev = '';
            $data_array = array();
            $width_px = $width / $value->width;
            $space_count = 0;
            foreach ($value->content as $sub_key => $sub_value):
                if(strpos($sub_value->data, '<br>') !== FALSE):
                    $exploded = explode('<br>', $sub_value->data);
                    if(count($exploded) > 0):
                        $exploded_value_data = '';
                        foreach ($exploded as $exploded_key => $exploded_value):
                            $space_count = ($width - strlen($exploded_value)) / 2;
                            $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                            $space = '';
                            for($i=0; $i < $space_count; $i++):
                                $space .= ' ';
                            endfor;
                            $exploded_value_data .= $space.$exploded_value.PHP_EOL;
                        endforeach;
                        $sub_value->data = $exploded_value_data;
                    endif;
                endif;

                $space = '';
                if($y_point == 0 AND $x_point == 0):
                    array_push($data_array, $sub_value->data);
                    // $sub_value_prev .= $sub_value->data;
                else:
                    // Next word with next line
                    if($sub_value->y > $y_point):

                        // For identifying columns in receipt
                        $data_array = array_values(array_filter($data_array, 'strlen'));
                        switch (count($data_array)):
                            case 1:
                                if($x_point < 100):
                                    $space_count = ($width - strlen($data_array[0])) / 2;
                                else:
                                    $space_count = ($width - strlen($data_array[0]));
                                endif;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                                for($i=0; $i < $space_count; $i++):
                                    $space .= ' ';
                                endfor;

                                $array_keyword = array('ITEMS',
                                                        'DOLLARS',
                                                        'FEES',
                                                        'PAYMENT MODE',
                                                        'VAT',
                                                        'MINUS',
                                                        'NET VALUES',
                                                        'CUSTOMER NAME:',
                                                        'TIN:',
                                                        'ADDRESS:',
                                                        'RETURN SLIP #:',
                                                        'DATE AND TIME:',
                                                        'REF. SI #:',
                                                        'CASHIER:',
                                                        'SALES INVOICE #:',
                                                        'DATE:',
                                                        'SUBTOTAL:',
                                                        'DISCOUNT:',
                                                        'CASH',
                                                        'TOTAL AMOUNT DUE:',
                                                        'VATABLE SALES:',
                                                        'VAT AMOUNT:',
                                                        'VAT-EXEMPT SALES:',
                                                        'ZERO-RATED SALES:',
                                                        'TOTAL SALE:',
                                                        'BUS. NAME/STYLE:',
                                                        'SALES',
                                                        'SODEP',
                                                        'SHIPPING',
                                                        'TOTAL',
                                                        'INVOICE COUNTS',
                                                        'FEE',
                                                        '# OF TRANS:',
                                                        'CLOSED BY:',
                                                        'STORE NAME:',
                                                        'STORE CODE:',
                                                        'SUBSIDIARY:',
                                                        'WORKSTATION:',
                                                        'CASHIER(S):',
                                                        'DRAWER:',
                                                        'TILL:',
                                                        '# OF TRANSACTIONS:',
                                                        'OPEN DATE/TIME:',
                                                        'CLOSE DATE/TIME:',
                                                        'PAID IN:',
                                                        'PAID OUT:',
                                                        'BEGIN:',
                                                        'NET:',
                                                        'COUNT:',
                                                        'OVER:',
                                                        'LEAVE:',
                                                        'DEPOSIT:',
                                                        'DATE RANGE:',
                                                        'POS TERMINAL NO:'
                                                    );
                                if(strpos(strtoupper($data_array[0]), '*** SALES INVOICE ***') !== FALSE OR strpos(strtoupper($data_array[0]), '*** RETURN ***') !== FALSE OR strpos(strtoupper($data_array[0]), '* Z-READING *') !== FALSE OR strpos(strtoupper($data_array[0]), '* X-READING *') !== FALSE):
                                    fwrite($file, PHP_EOL.$space.$data_array[0].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NAME/STYLE') !== FALSE):
                                    fwrite($file, $data_array[0].PHP_EOL.PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NET OF VAT') !== FALSE):
                                    fwrite($file, PHP_EOL.$space.$data_array[0].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'DISCOUNTED PRICE') !== FALSE):
                                    fwrite($file, $space.$data_array[0].PHP_EOL);
                                elseif(in_array(strtoupper($data_array[0]), $array_keyword)):
                                    fwrite($file, $data_array[0].PHP_EOL);
                                else:
                                    fwrite($file, $space.$data_array[0].PHP_EOL);
                                endif;

                                $space = '';
                                break;
                            case 2:
                                end($data_array);
                                
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1]);
                                if(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE OR strpos(strtoupper($data_array[1]), 'ITEMS SOLD') !== FALSE AND count(explode('/', $data_array[0])) != 3):
                                    $space_count = (40 - $str_length) / 2;
                                elseif(strpos(strtoupper($data_array[0]), 'SUBTOTAL:') !== FALSE OR strpos(strtoupper($data_array[0]), 'DISCOUNT:') !== FALSE):
                                    $space_count = (40 - $str_length) - 2;
                                else:
                                    $space_count = (40 - $str_length);
                                endif;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_DOWN);
                                if($space_count < 40):
                                    for($i=0; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;



                                if(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE):
                                    fwrite($file, $space.' '.$data_array[0].$space.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'LESS') !== FALSE):
                                    fwrite($file, $space.$data_array[0].' '.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'NAME/STYLE') !== FALSE):
                                    fwrite($file, $data_array[0].$space.$data_array[1].PHP_EOL.PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'SUBTOTAL:') !== FALSE OR strpos(strtoupper($data_array[0]), 'DISCOUNT:') !== FALSE):
                                    fwrite($file, $space.$data_array[0].'  '.$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'ENDING RETURN') !== FALSE):
                                    $spaces = '';
                                    $spaceCnt = 40 - $str_length;
                                    for($i = 1; $i <= $spaceCnt; $i++) {
                                        $spaces .= ' ';
                                    }

                                    fwrite($file, $data_array[0].$spaces.$data_array[1].PHP_EOL);
                                    fwrite($file, ' ' . PHP_EOL);
                                    fwrite($file, ' ' . PHP_EOL);
                                // elseif($value->print_type == 6 AND strpos(strtoupper($data_array[0]), 'CASH FLOW TOTAL:') !== FALSE):
                                //     fwrite($file, $data_array[0].$space.$space.$data_array[1].PHP_EOL);
                                // elseif($value->print_type == 6 AND count(explode('/', $data_array[0])) != 3):
                                //     fwrite($file, $space.$data_array[0].$data_array[1].PHP_EOL);
                                elseif(strpos(strtoupper($data_array[0]), 'DATE RANGE:') !== FALSE OR strpos(strtoupper($data_array[0]), 'POS TERMINAL NO:') !== FALSE):
                                    fwrite($file, $space.$data_array[0].' '.$data_array[1].PHP_EOL);
                                else:
                                    $spaces = '';
                                    $spaceCnt = 40 - $str_length;
                                    for($i = 1; $i <= $spaceCnt; $i++) {
                                        $spaces .= ' ';
                                    }

                                    fwrite($file, $data_array[0].$spaces.$data_array[1].PHP_EOL);
                                endif;

                                break;
                            case 3:
                                end($data_array);
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1].$data_array[2]);
                                $space_count = (40 - $str_length) /2;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_DOWN);
                                if($space_count < 40):
                                    for($i=0; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;
                                fwrite($file, $data_array[0].$space.$data_array[1].$space.$data_array[2].PHP_EOL);
                                break;
                            case 4:
                                end($data_array);
                                $last_key = key($data_array);
                                $sub_value_prev = '';
                                $space = '';
                                $str_length = strlen($data_array[0].$data_array[1].$data_array[2].$data_array[3]);
                                $space_count = (40 - $str_length) /3;
                                $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                                if($space_count < 40 ):
                                    for($i=1; $i < $space_count; $i++):
                                        $space .= ' ';
                                    endfor;
                                else:
                                    $space .= ' ';
                                endif;
                                fwrite($file, $data_array[0].$space.$data_array[1].$space.$data_array[2].$space.$data_array[3].PHP_EOL);
                                break;
                        endswitch;

                        $sub_value_prev = '';
                        $data_array = array();
                        if($sub_key == count($value->content) - 1):
                            $space = '';
                            $space_count = ($width - strlen($sub_value->data)) / 2;
                            // $space_count = $width_px * $sub_value->x;
                            $space_count = round($space_count, 0, PHP_ROUND_HALF_UP);
                            for($i=0; $i < $space_count; $i++):
                                $space .= ' ';
                            endfor;
                            fwrite($file, $space.$sub_value->data.PHP_EOL.PHP_EOL);
                        else:
                            array_push($data_array, $sub_value->data);
                            // $sub_value_prev .= $sub_value->data;
                        endif;
                    // Next word with the same line
                    elseif($sub_value->y == $y_point OR $sub_value->y < ($y_point + 5)):
                        array_push($data_array, $sub_value->data);
                        // $sub_value_prev .= $space.$sub_value->data;
                    endif;
                endif;
                $y_point = $sub_value->y;
                $x_point = $sub_value->x;
            endforeach;
        endforeach;
        fclose($file);


        
        $data = file_get_contents($filePath);
        $base64 = base64_encode($data);

        echo json_encode(array('status_code' => 200, 'filename' => 'xout.txt', 'data' => $base64, 'type' => 'TXT'));
    }
?>
