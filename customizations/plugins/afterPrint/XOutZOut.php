<?php
    require_once('../../libraries/adodb5/adodb.inc.php');
    require_once('../../config/gticonfig.php');

    $docDesignConfig = [];
    if (file_exists("../../config/doc_design_config.json")) {
        $docDesignConfig = file_get_contents("../../config/doc_design_config.json");
        $docDesignConfig = json_decode($docDesignConfig);
    }

    if ($_SERVER['REQUEST_METHOD'] == 'POST'):
        $postdata   = file_get_contents("php://input");
        $request    = json_decode($postdata);

        switch ($_REQUEST['action']):
            case 'getDynamicValuesXOutZOut':
                echo getDynamicValuesXOutZOut($conn, $_REQUEST, $docDesignConfig);
                break;
        endswitch;

    elseif ($_SERVER['REQUEST_METHOD'] == 'GET'):

    endif;

    function getDynamicValuesXOutZOut($conn, $request, $docDesignConfig) {

        include_once('../PLBIRReports/birReports_Queries_MySQL.php');

        $fromDate = $request['filters']['fromDate'];
        if ($request['filters']['fromDate'] == 'minOfDateToday') {
            $fromDate = date("m/d/Y") . ' 12:00 AM';
        }

        $toDate = $request['filters']['toDate'];
        if ($request['filters']['toDate'] == 'maxOfDateToday') {
            $toDate = date('m/d/Y h:i A');
        }

        $workstation = (isset($request['filters']['workstation'])) ? $request['filters']['workstation'] : 'all';

        $cashier = (isset($request['filters']['cashier'])) ? $request['filters']['cashier'] : 'all';

        $queries = new BIRReport_Queries(
            $fromDate, 
            $toDate,
            $workstation,
            $store = 'all',
            $cashier
        );

        $sql = $queries->getXZReading();

        $results = [];

        if (SYSCONFIG_DB_TYPE == 'MYSQL') {
            $conn = mysqli_connect(SYSCONFIG_DB_MYSQL_HOST, SYSCONFIG_DB_MYSQL_USER, SYSCONFIG_DB_MYSQL_PASS, SYSCONFIG_DB_MYSQL_NAME);
            mysqli_query($conn, 'SET SESSION group_concat_max_len = 1048576;');
            mysqli_query($conn, 'SET @end := 0;');
            mysqli_query($conn, "SET sql_mode = '';");
            
            if ($result = mysqli_query($conn, $sql)) {
                $results =  mysqli_fetch_assoc($result);
            }
        }

        $defaultSBSConfig = [];
        $currentSBSConfig = [];

        $defaultStoreConfig = [];
        $currentStoreConfig = [];

        $defaultWSConfig = [];
        $currentWSConfig = [];

        if ($request['config_settingsVersion'] == 'v3') {

            $defaultSBSConfig = (count($docDesignConfig)) ? current((array)$docDesignConfig) : [] ;

            foreach ($docDesignConfig as $key => $sbs) {

                if (isset($sbs->subsidiaryNo) && isset($sbs->stores)) {

                    if ($sbs->subsidiaryNo == $request['filters']['sbsNo']) {

                       $currentSBSConfig = $sbs;

                        $defaultStoreConfig = current((array)$sbs->stores);

                        foreach ($sbs->stores as $key => $store) {
                            
                            if (isset($store->storeNo) && isset($store->workstations)) {

                                if ($store->storeNo == $request['filters']['storeNo']) {

                                    $currentStoreConfig = $store;

                                    $defaultWSConfig = current((array)$store->workstations);

                                    foreach ($store->workstations as $workstation) {

                                        if (isset($workstation->workstationNo)) {
                                            if ($workstation->workstationNo == $request['filters']['workstationNo']) {

                                                $currentWSConfig = $workstation;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            $SBSConfig = (count($currentSBSConfig)) ? $currentSBSConfig : $defaultSBSConfig ;
            $storeConfig = (count($currentStoreConfig)) ? $currentStoreConfig : $defaultStoreConfig ;
            $WSConfig = (count($currentWSConfig)) ? $currentWSConfig : $defaultWSConfig ;

            $address1 = (isset($storeConfig->address1)) ? $storeConfig->address1 : '' ;
            $address2 = (isset($storeConfig->address2)) ? $storeConfig->address2 : '' ;
            $address3 = (isset($storeConfig->address3)) ? $storeConfig->address3 : '' ;
            $address4 = (isset($storeConfig->address4)) ? $storeConfig->address4 : '' ;
            $address5 = (isset($storeConfig->address5)) ? $storeConfig->address5 : '' ;
            $address6 = (isset($storeConfig->address6)) ? $storeConfig->address6 : '' ;

            $vatRegTin = (isset($storeConfig->vatRegTin)) ? $storeConfig->vatRegTin : '' ;
            $serialNumber = (isset($WSConfig->serialNo)) ? $WSConfig->serialNo : '' ;
            $min = (isset($WSConfig->min)) ? $WSConfig->min : '' ;
            $sotftwareVersion = (isset($storeConfig->softwareVersion)) ? $storeConfig->softwareVersion : '' ;
            $ptuNo = (isset($WSConfig->ptuNo)) ? $WSConfig->ptuNo : '' ;

        }

        $data = [];

        $fields = $request['fields'];

        $zcount = 1;

        // echo "<pre>";
        // print_r($fields);

        if ($results) {
            foreach ($fields as $key => $value) {
                switch ($key) {
                    case 'value#address_1 value#address_2':
                        $data[$key] = $address1 . ' ' . $address2; 
                        break;

                    case 'value#address_1':
                        $data[$key] = $address1; 
                        break;

                    case 'value#address_2':
                        $data[$key] = $address2; 
                        break;

                    case 'value#address_3':
                        $data[$key] = $address3; 
                        break;

                    case 'value#address_4':
                        $data[$key] = $address4; 
                        break;

                    case 'value#address_5':
                        $data[$key] = $address5; 
                        break;

                    case 'value#address_6':
                        $data[$key] = $address6; 
                        break;

                    case 'value#vat_reg_tin':
                        $data[$key] = $vatRegTin; 
                        break;

                    case 'value#serial_number':
                        $data[$key] = $serialNumber; 
                        break;

                    case 'value#min':
                        $data[$key] = $min; 
                        break;

                    case 'value#software_version':
                        $data[$key] = $sotftwareVersion; 
                        break;

                    case 'value#ptu_number':
                        $data[$key] = $ptuNo; 
                        break;

                    case 'Date Range: value#date_range':
                        $from = date_format(date_create($fromDate), 'm/d/Y');
                        $to = date_format(date_create($toDate), 'm/d/Y');
                        $data[$key] = 'Date Range: ' . $from . ' - ' . $to;
                        break;

                    case 'POS Terminal No: value#workstation_no':
                        $data[$key] = 'POS Terminal No: ' . (($workstation == 'all') ? $request['filters']['allWorkstations'] : $request['filters']['workstationNo']);
                        break;

                    case 'Cashier: value#cashier_name':
                        $data[$key] = 'Cashier: ' . $request['filters']['cashierName'] . ' ID: ' . $request['filters']['cashierId'] ;
                        break;

                    case 'value#cashier_id':
                        $data[$key] = $request['filters']['cashierId'];
                        break;

                    case 'Z-COUNT: value#zcount':
                        $data[$key] = 'Z-COUNT: ' . ((isset($request['filters']['sequence'])) ? $request['filters']['sequence'] : '1') ;
                        $zcount = ((isset($request['filters']['sequence'])) ? $request['filters']['sequence'] : '1');
                        break;

                    case 'value#beg_balance':
                        $data[$key] = (isset($results['BEGINNING'])) ? number_format($results['BEGINNING'], 2) : '0.00' ; 
                        break;

                    case 'value#end_balance':
                        $data[$key] = (isset($results['ENDING'])) ? number_format($results['ENDING'], 2) : '0.00' ; 
                        break;

                    case 'value#gross_sales_gross_sales':
                        $data[$key] = (isset($results['GROSS_INCOME'])) ? number_format($results['GROSS_INCOME'], 2) : '0.00' ; 
                        break;
                    
                    case 'value#gross_sales_fee_gc_exess':
                        $data[$key] = (isset($results['FEES'])) ? number_format($results['FEES'], 2) : '0.00' ;
                        break;

                    case 'value#gross_sales_other_charges':
                        $data[$key] = '0.00' ;
                        break;

                    case 'value#adjusted_gross_sales_vat_adj':
                        $data[$key] = (isset($results['VAT_ADJUSTMENT'])) ? number_format($results['VAT_ADJUSTMENT'], 2) : '0.00' ;
                        break;

                    case 'value#adjusted_gross_sales_other_charges':
                        // $data[$key] = (isset($results['DETAX_DISC'])) ? number_format($results['DETAX_DISC'], 2) : '0.00' ;
            $data[$key] = (isset($results['DETAX_DISC'])) ? '0.00' : '0.00' ;
                        break;

                    case 'value#adjusted_gross_sales_net_sales':
                        $data[$key] = (isset($results['NET_AMOUNT'])) ? number_format($results['NET_AMOUNT'], 2) : '0.00' ;
                        break;

                    case 'value#fee_breakdown_fee_gc_exess':
                        $data[$key] = (isset($results['FEES'])) ? number_format($results['FEES'], 2) : '0.00' ;
                        break;

                    case 'value#minus_net_round_amount':
                        $data[$key] = (isset($results['ROUNDING_OFFSET'])) ? number_format($results['ROUNDING_OFFSET'], 2) : '0.00' ;
                        break;

                    case 'value#vat_breakdown_vatable_sales':
                        $data[$key] = (isset($results['VAT_SALES'])) ? number_format($results['VAT_SALES'], 2) : '0.00' ;
                        break;

                    case 'value#vat_breakdown_vat_amount':
                        $data[$key] = (isset($results['VAT_AMOUNT'])) ? number_format($results['VAT_AMOUNT'], 2) : '0.00' ;
                        break;

                    case 'value#vat_breakdown_vat_exempt_sales':
                        $data[$key] = (isset($results['VAT_EXEMPT'])) ? number_format($results['VAT_EXEMPT'], 2) : '0.00' ;
                        break;

                    case 'value#vat_breakdown_zero_rated_sales':
                        $data[$key] = (isset($results['ZERO_RATED'])) ? number_format($results['ZERO_RATED'], 2) : '0.00' ;
                        break;

                    case 'value#return_return':
                        $data[$key] = (isset($results['RETURNS'])) ? number_format($results['RETURNS'], 2) : '0.00' ;
                        break;

                    case 'value#payment_summary_cash_total':
                        $data[$key] = (isset($results['CASH_PAYMENTS'])) ? number_format($results['CASH_PAYMENTS'], 2) : '0.00' ;
                        break;

                    case 'value#payment_summary_non_cash_total':
                        $data[$key] = (isset($results['NON_CASH_PAYMENTS'])) ? number_format($results['NON_CASH_PAYMENTS'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_credit_card':
                        $data[$key] = (isset($results['TENDER_CREDIT_CARD'])) ? number_format($results['TENDER_CREDIT_CARD'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_cod':
                        $data[$key] = (isset($results['TENDER_COD'])) ? number_format($results['TENDER_COD'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_check':
                        $data[$key] = (isset($results['TENDER_CHECK'])) ? number_format($results['TENDER_CHECK'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_charge':
                        $data[$key] = (isset($results['TENDER_CHARGE'])) ? number_format($results['TENDER_CHARGE'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_store_credit':
                        $data[$key] = (isset($results['TENDER_STORE_CREDIT'])) ? number_format($results['TENDER_STORE_CREDIT'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_deposit':
                        $data[$key] = (isset($results['TENDER_DEPOSIT'])) ? number_format($results['TENDER_DEPOSIT'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_payments':
                        $data[$key] = (isset($results['TENDER_PAYMENTS'])) ? number_format($results['TENDER_PAYMENTS'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_gift_certificate':
                        $data[$key] = (isset($results['TENDER_GIFT_CERTIFICATE'])) ? number_format($results['TENDER_GIFT_CERTIFICATE'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_gift_card':
                        $data[$key] = (isset($results['TENDER_GIFT_CARD'])) ? number_format($results['TENDER_GIFT_CARD'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_debit_card':
                        $data[$key] = (isset($results['TENDER_DEBIT_CARD'])) ? number_format($results['TENDER_DEBIT_CARD'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_travelers_check':
                        $data[$key] = (isset($results['TENDER_TRAVELERS_CHECK'])) ? number_format($results['TENDER_TRAVELERS_CHECK'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_central_gift_card':
                        $data[$key] = (isset($results['TENDER_CENTRAL_GIFT_CARD'])) ? number_format($results['TENDER_CENTRAL_GIFT_CARD'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_central_gift_certificate':
                        $data[$key] = (isset($results['TENDER_CENTRAL_GIFT_CERTIFICATE'])) ? number_format($results['TENDER_CENTRAL_GIFT_CERTIFICATE'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_central_credit':
                        $data[$key] = (isset($results['TENDER_CENTRAL_CREDIT'])) ? number_format($results['TENDER_CENTRAL_CREDIT'], 2) : '0.00' ;
                        break;

                    case 'value#non_cash_payments_customer_loyalty':
                        $data[$key] = (isset($results['TENDER_CUSTOMER_LOYALTY'])) ? number_format($results['TENDER_CUSTOMER_LOYALTY'], 2) : '0.00' ;
                        break;

                    case 'value#discounts_sc_disc':
                        $data[$key] = (isset($results['SC_DISC'])) ? number_format($results['SC_DISC'], 2) : '0.00' ;
                        break;

                    case 'value#discounts_pwd_disc':
                        $data[$key] = (isset($results['PWD_DISC'])) ? number_format($results['PWD_DISC'], 2) : '0.00' ;
                        break;

                    case 'value#discounts_sp_disc':
                        $data[$key] = (isset($results['SP_DISC'])) ? number_format($results['SP_DISC'], 2) : '0.00' ;
                        break;

                    case 'value#discounts_athlete_disc':
                        $data[$key] = (isset($results['ATHLETE_DISC'])) ? number_format($results['ATHLETE_DISC'], 2) : '0.00' ;
                        break;

                    case 'value#discounts_others':
                        $data[$key] = (isset($results['OTHER_DISC'])) ? number_format($results['OTHER_DISC'], 2) : '0.00' ;
                        break;

                    case 'value#transaction_counter_beginning_si':
                        $data[$key] = (isset($results['BEGINNING_SI'])) ? $results['BEGINNING_SI'] : '0000000' ;
                        break;

                    case 'value#transaction_counter_ending_si':
                        $data[$key] = (isset($results['ENDING_SI'])) ? $results['ENDING_SI'] : '0000000' ;
                        break;

                    case 'value#transaction_counter_beginning_return':
                        $data[$key] = (isset($results['BEGINNING_RETURN_SI'])) ? $results['BEGINNING_RETURN_SI'] : '0000000' ;
                        break;

                    case 'value#transaction_counter_ending_return':
                        $data[$key] = (isset($results['ENDING_RETURN_SI'])) ? $results['ENDING_RETURN_SI'] : '0000000' ;
                        break;

                    case 'value#transaction_counter_total_si':
                        $data[$key] = (isset($results['TOTAL_SI'])) ? $results['TOTAL_SI'] : '0' ;
                        break;

                    case 'value#transaction_counter_total_return_si':
                        $data[$key] = (isset($results['TOTAL_RETURN_SI'])) ? $results['TOTAL_RETURN_SI'] : '0' ;
                        break;

                    case 'value#transaction_counter_transaction_count':
                        $data[$key] = (isset($results['TRANSACTION_COUNT'])) ? $results['TRANSACTION_COUNT'] : '0' ;
                        break;

                    // CASH FLOW BREAKDOWN
                    case 'value#open_amount':
                        $data[$key] = (isset($results['OPEN_AMOUNT'])) ? number_format($results['OPEN_AMOUNT'], 2) : '0.00' ;  
                        break;
                    case 'value#cash_sales':
                        $data[$key] = (isset($results['CASH_PAYMENTS'])) ? number_format($results['CASH_PAYMENTS'], 2) : '0.00' ;  
                        break;
                    case 'value#disb_paid_in':
                        $data[$key] = (isset($results['DISB_PAID_IN'])) ? number_format($results['DISB_PAID_IN'], 2) : '0.00' ;  
                        break;
                    case 'value#disb_paid_out':
                        $data[$key] = (isset($results['DISB_PAID_OUT'])) ? number_format($results['DISB_PAID_OUT'], 2) : '0.00' ;  
                        break;
                    case 'value#cash_drop_less':
                        $data[$key] = (isset($results['CASH_DROP_LESS'])) ? number_format($results['CASH_DROP_LESS'], 2) : '0.00' ;  
                        break;
                    case 'value#total_in_drawer':
                        $data[$key] =
                            number_format(
                                ((isset($results['OPEN_AMOUNT'])) ? $results['OPEN_AMOUNT'] : 0) +
                                ((isset($results['CASH_PAYMENTS'])) ? $results['CASH_PAYMENTS'] : 0) +
                                ((isset($results['DISB_PAID_IN'])) ? $results['DISB_PAID_IN'] : 0) -
                                ((isset($results['DISB_PAID_OUT'])) ? $results['DISB_PAID_OUT'] : 0) -
                                ((isset($results['CASH_DROP_LESS'])) ? $results['CASH_DROP_LESS'] : 0)
                            , 2);  
                        break;
                    case 'value#cash_count_declaration':
                        $data[$key] = (isset($results['CASH_COUNT_DECLARATION'])) ? number_format($results['CASH_COUNT_DECLARATION'], 2) : '0.00' ;  
                        break;
                    case 'value#cash_over_short':
                        $data[$key] = 
                            number_format(
                                ((isset($results['CASH_COUNT_DECLARATION'])) ? $results['CASH_COUNT_DECLARATION'] : 0) -
                                (
                                    ((isset($results['OPEN_AMOUNT'])) ? $results['OPEN_AMOUNT'] : 0) +
                                    ((isset($results['CASH_PAYMENTS'])) ? $results['CASH_PAYMENTS'] : 0) +
                                    ((isset($results['DISB_PAID_IN'])) ? $results['DISB_PAID_IN'] : 0) -
                                    ((isset($results['DISB_PAID_OUT'])) ? $results['DISB_PAID_OUT'] : 0) -
                                    ((isset($results['CASH_DROP_LESS'])) ? $results['CASH_DROP_LESS'] : 0)
                                )
                            , 2);
                        break;
                    }
            }
        }

        // CASH COUNT DENOMINATION
        $input = $results['CASH_COUNT_DENOMINATION'];
        $count_denomination = [];
        
        if (!empty($input)) {
            $pairs = explode('|', $input);
            foreach ($pairs as $pair) {
                list($key, $value) = array_map('trim', explode('-', $pair));
                $count_denomination[(int)$key] = (int)$value;
            }
        }
        $data['value#count_denomination'] = !empty($count_denomination) ? $count_denomination : 'empty value';
        
        $data['value#gross_sales_total'] =
            number_format(
                (
                    (isset($data['value#gross_sales_gross_sales']) ? $results['GROSS_INCOME'] : 0 ) +
                    (isset($data['value#gross_sales_fee_gc_exess']) ? $results['FEES'] : 0 )
                ), 2
            ); 

        $data['value#adjusted_gross_sales_gross_sales'] =
            number_format(
                (
                    (
                        (isset($data['value#gross_sales_gross_sales']) ? $results['GROSS_INCOME'] : 0 ) +
                        (isset($data['value#gross_sales_fee_gc_exess']) ? $results['FEES'] : 0 )
                    ) -
                    (isset($data['value#return_return']) ? $results['RETURNS'] : 0 )
                ), 2
            ); 

        $data['value#payment_summary_total_payments'] =
            number_format(
                (
                    (isset($data['value#payment_summary_cash_total']) ? $results['CASH_PAYMENTS'] : 0 ) +
                    (isset($data['value#payment_summary_non_cash_total']) ? $results['NON_CASH_PAYMENTS'] : 0 )
                ), 2
            ); 

        $data['value#discount_total_discounts'] = 
            number_format(
                (
                    (isset($data['value#discounts_sc_disc']) ? $results['SC_DISC'] : 0 ) + 
                    (isset($data['value#discounts_pwd_disc']) ? $results['PWD_DISC'] : 0 ) + 
                    (isset($data['value#discounts_sp_disc']) ? $results['SP_DISC'] : 0 ) + 
                    (isset($data['value#discounts_athlete_disc']) ? $results['ATHLETE_DISC'] : 0 ) + 
                    (isset($data['value#discounts_others']) ? $results['OTHER_DISC'] : 0 )
                ), 2
            ); 

        $data['value#adjusted_gross_sales_discounts'] = 
            number_format(
                (
                    (isset($data['value#discounts_sc_disc']) ? $results['SC_DISC'] : 0 ) + 
                    (isset($data['value#discounts_pwd_disc']) ? $results['PWD_DISC'] : 0 ) + 
                    (isset($data['value#discounts_sp_disc']) ? $results['SP_DISC'] : 0 ) + 
                    (isset($data['value#discounts_athlete_disc']) ? $results['ATHLETE_DISC'] : 0 ) + 
                    (isset($data['value#discounts_others']) ? $results['OTHER_DISC'] : 0 )
                ), 2
            ); 

        $data['value#adjusted_gross_sales_net_sales'] =
            number_format(
                (
                    (
                        ((isset($data['value#gross_sales_gross_sales']) ? $results['GROSS_INCOME'] : 0 ) +
            (isset($data['value#gross_sales_fee_gc_exess']) ? $results['FEES'] : 0 ) -
            (isset($data['value#return_return']) ? $results['RETURNS'] : 0 ))
                    ) - 
                    (
                        (isset($data['value#discounts_sc_disc']) ? $results['SC_DISC'] : 0 ) + 
                        (isset($data['value#discounts_pwd_disc']) ? $results['PWD_DISC'] : 0 ) + 
                        (isset($data['value#discounts_sp_disc']) ? $results['SP_DISC'] : 0 ) + 
                        (isset($data['value#discounts_athlete_disc']) ? $results['ATHLETE_DISC'] : 0 ) + 
                        (isset($data['value#discounts_others']) ? $results['OTHER_DISC'] : 0 )
                    ) // -
                    // ((isset($results['DETAX_DISC'])) ? $results['DETAX_DISC'] : 0 )
                ), 2
            );

        if ($data['value#adjusted_gross_sales_net_sales'] != $data['value#payment_summary_total_payments']) {
            $data['value#adjusted_gross_sales_net_sales'] = $data['value#payment_summary_total_payments'];
        }    

        $data['value#adjusted_gross_sales_net_sales'] = number_format($results['NET_AMOUNT'], 2);   

        $data['value#accum_grand_total_sales']  = (isset($results['ENDING'])) ? number_format($results['ENDING'], 2) : '0.00' ;

        $tender_credit_cards = [];

        if (isset($results['TENDER_CREDIT_CARDS'])) {
            $resultTCC = explode('|',$results['TENDER_CREDIT_CARDS']);
            foreach ($resultTCC as $TCC) {
                $eTCC = explode(":", $TCC);
				
				$expanded = [];
				foreach ($eTCC as $part) {
					foreach (explode("...", $part) as $sub) {
						$expanded[] = $sub;
					}
				}
				$eTCC = $expanded;
				
                $receiptType = 0;

				$creditCards = array_map(function($item) {
					return preg_replace('/^0,/', '', $item); // Remove "0," prefix dynamically
				}, $eTCC);
				
				$creditCards = array_filter($creditCards, function($item) {
					return $item !== '0' && $item !== ''; // Remove "0" or empty string values
				});
				
				$creditCards = array_values($creditCards);
				
				foreach ($creditCards as $cc) {
					$creditCardInfo = explode("=", $cc);
					
					if(count($creditCardInfo) < 2) continue;

					$key = $creditCardInfo[0];
					$value = $creditCardInfo[1];
					if($key === 'CATM'){
						$currentValue = isset($value) ? $value : 0 ;
					}else{
						$currentValue = isset($value) ? $value : 0 ;
					}
	
					if ($receiptType == 0) {
						 if (!isset($tender_credit_cards[$key])) {
							$tender_credit_cards[$key] = [$key, 0]; // Initialize with the key and default value 0
						}
                        $tender_credit_cards[$key][1] += $currentValue;
                    } else {
                        $tender_credit_cards[$key] = [$key, $currentValue];
                    }
				}	
            }
        }
        foreach ($tender_credit_cards as $key => $value) {
            $tender_credit_cards[$key] = number_format($value[1], 2);
            if ($receiptType == 0) unset($value[1]);
        }
		
        $data['value#tender_credit_cards'] = (count($tender_credit_cards)) ? $tender_credit_cards : 'empty value' ;

        $non_cash_payments_breakdown = [];

        if (isset($results['NON_CASH_PAYMENT_NAMES_BREAKDOWN'])) {
            $resultTCC = explode(',',$results['NON_CASH_PAYMENT_NAMES_BREAKDOWN']);

            foreach ($resultTCC as $TCC) {
                $eTCC = explode(":", $TCC);
                $receiptType = $eTCC[1];

                $paymentPayments = explode("...", $eTCC[0]);

                foreach ($paymentPayments as $key => $pay) {
                    $payments = explode("=", $pay);
                    $key = 'Others';
                    switch ($payments[0]) {
                        case '1':
                            $key = 'CHECK';
                            break;
                        case '3':
                            $key = 'COD';
                            break;
                        case '4':
                            $key = 'CHARGE';
                            break;
                        case '5':
                            $key = 'STORE CREDIT';
                            break;
                        case '7':
                            $key = 'DEPOSIT';
                            break;
                        case '9':
                            $key = 'GIFT CERTIFICATE';
                            break;
                        case '10':
                            $key = 'GIFT CARD';
                            break;
                        case '11':
                            $key = 'DEBIT CARD';
                            break;
                        case '13':
                            $key = 'TRAVELER\'S CHECK';
                            break;
                        case '15':
                            $key = 'CENTRAL GIFT CARD';
                            break;
                        case '16':
                            $key = 'CENTRAL GIFT CERTIFICATE';
                            break;
                        case '17':
                            $key = 'CENTRAL CREDIT';
                            break;
                        case '18':
                            $key = 'CUSTOMER LOYALTY';
                            break;
                    }
                    $value = $payments[1];
                    $currentValue = (isset($non_cash_payments_breakdown[$key])) ? $non_cash_payments_breakdown[$key] : 0 ;

                    if ($receiptType != 2) {
                        $non_cash_payments_breakdown[$key] = $currentValue + $value;
                    } else {
                        $non_cash_payments_breakdown[$key] = $currentValue + 0;
                    }
                }
            }
        }

        foreach ($non_cash_payments_breakdown as $key => $value) {
            $non_cash_payments_breakdown[$key] = number_format($non_cash_payments_breakdown[$key], 2);
        }

        $data['value#non_cash_payments_breakdown'] = (count($non_cash_payments_breakdown)) ? $non_cash_payments_breakdown : 'empty value' ;

        
        return json_encode(['data' => $data, 'zcount' => $zcount]);

    }