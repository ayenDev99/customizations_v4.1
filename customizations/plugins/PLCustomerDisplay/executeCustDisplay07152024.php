<?php
require_once('../../libraries/adodb5/adodb.inc.php');
require_once('../../config/gticonfig.php');
//for each 8080 8081
$temp_name = tempnam(SYSCONFIG_CUSTOMERDISPLAY_FILE_PATH, 'CRDY');
if ($_SERVER['REQUEST_METHOD'] == 'POST'):
   $postdata = file_get_contents("php://input");
   $request  = json_decode($postdata);
   $item     = $request->item;
   $fee      = $request->fee;
   $shipping = $request->shipping;
   $discount = $request->discount;
   $total    = $request->total;
   $tender   = $request->tender;
   $employee1_name = $request->employee1_name;
   $workstation_number = $request->workstation_number;
   $serverName = $request->serverName;
   // $multidisplay
   $port = "8080";
   $urlParts = explode(":", $serverName);
    if (isset($urlParts[2])) {
        // Output the port number
        $port = $urlParts[2];
    } else {
        echo json_encode(array(
           'status' => 400,
           'statusText' => 'Bad Request'
       ));
        die();
    }

    $filepath = "";
   
    // Loop through the array
    foreach ($multidisplay as $key => $value) {
       
        // Check if the current value is the same as the first value
        if ($port == $key) {
            // Output the corresponding value
            $filepath = $value;
            
            break; // Stop the loop since we found a match
        }
    }
    // echo $temp_name;
    // die();
   //set filepath based on server
   // $udf2array = explode("|0|", SYSCONFIG_CUSTOMERDISPLAY_MULTIFILE_PATH);

   //  // Loop through the array
   //  foreach ($udf2array as $element) {
   //      // Split each element into key and value
   //      list($key, $value) = explode("=|=", $element);

   //      // Check if $string2 is equal to the key
   //      if ($serverName === $key) {
   //          // Output the value after =|=
   //          $temp_name = $value;
   //          break; // Stop the loop since we found a match
   //      }
   //  } 
    
    $temp_name = tempnam($filepath, 'CRDY');
    $file     = fopen($filepath . '/CUSTDISPLAY.txt', 'w');

    if (count($item) > 0):
       foreach ($item as $a):
           fwrite($file, $a->item_sid . '|' . $a->item_desc . '|' . $a->item_qty . '|' . $a->item_price . '|' . $a->item_ext_price . '|' . $a->item_alu . '|' . $a->record_flag . "\r\n");
       endforeach;
    endif;
    if (!empty($fee->fee_name) AND $fee->fee_name != '' AND !empty($fee->fee_amount) AND $fee->fee_amount != '' AND $fee->fee_amount != 0):
       // fwrite($file, '|' . $fee->fee_name . '|1|' . $fee->fee_amount . '|' . $fee->fee_amount . '||' . $fee->record_flag . "\r\n");
    endif;
    if (!empty($shipping->shipping_method) AND $shipping->shipping_method != '' AND !empty($shipping->shipping_amt) AND $shipping->shipping_amt != '' AND $shipping->shipping_amt != 0):
       // fwrite($file, '|' . $shipping->shipping_method . '|1|' . $shipping->shipping_amt . '|' . $shipping->shipping_amt . '||' . $shipping->record_flag . "\r\n");
    endif;
    if ($discount->disc_amt != 0):
       // fwrite($file, '|GLOBAL DISCOUNT|1|' . $discount->disc_amt . '|' . $discount->disc_amt . '||' . $discount->record_flag . "\r\n");
    endif;
    fwrite($file, '|TOTAL|1|' . $total->subtotal_amt . '|' . $total->total_amt . '||' . $total->record_flag . '|' . $employee1_name . '|' .  ($discount->disc_amt + $total->lty_redeem_amt) . '|' . $tender->taken_amt . '|' . $tender->given_amt . '|' . $workstation_number);
    if ($tender->taken_amt != 0 OR $tender->given_amt != 0 AND $tender->tender_name != '' AND !empty($tender->tender_name)):
       // fwrite($file, '|' . $tender->tender_name . '|1|' . $tender->taken_amt . '|' . $tender->given_amt . '||' . $tender->record_flag . "\r\n");
    endif;
    fclose($file);
    echo json_encode(array(
       'status' => 200,
       'statusText' => 'OK'
    ));
else:
   echo json_encode(array(
       'status' => 400,
       'statusText' => 'Bad Request'
   ));
endif;
//shell_exec(getcwd() . '\CryptoFile.exe ' . $temp_name);
do {
   unlink($temp_name);
} while (file_exists($temp_name));
?>
