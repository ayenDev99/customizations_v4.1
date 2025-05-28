<?php
    require_once('../../libraries/adodb5/adodb.inc.php');
    require_once('../../libraries/tcpdf/tcpdf.php');
    require_once('../../config/gticonfig.php');

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $request = file_get_contents('php://input');
        $request = json_decode($request);
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $request = (object) $_GET;
    }

    $birReport = new BIRReport($conn);
    $birReport->setType($request->reportType);
    $birReport->setFromDate($request->fromDate);
    $birReport->setToDate($request->toDate);
    $birReport->setRequest($request);
    $birReport->setWorkstation($request->workstation);
    $birReport->setStore($request->store);
    $birReport->setCashier($request->cashier);
    $birReport->setConfig_settingsVersion($request->config_settingsVersion);
    $birReport->setNetRoundingOff($request->netRoundingOff);

    $docDesignConfig = [];
    if (file_exists("../../config/doc_design_config.json")) {
        $docDesignConfig = file_get_contents("../../config/doc_design_config.json");
        $docDesignConfig = json_decode($docDesignConfig);
    }
    $birReport->setDocDesignConfig($docDesignConfig);

    switch ($request->action) {
        case 'searchResult':
            $birReport->setCurrentPage($request->currentPage);
            echo $birReport->search();
            break;

        case 'export':
            echo $birReport->export();
            break;
    }

    class BIRReport {
        private $_currentPage = 1;
        private $_type;
        private $_fromDate;
        private $_toDate;
        private $conn;
        private $itemsPerPage = 10;
        private $request = null;
        private $workstation = 'all'; // UID
        private $store = 'all'; // UID
        private $cashier = 'all'; // UID
        private $config_settingsVersion = 'v2'; // UID
        private $docDesignConfig = []; 
        private $netRoundingOff; 

        function __construct($conn) {
            $this->conn = $conn;
        }

        public function setRequest($request) {
            $this->request = $request;
        }

        public function setType($type) {
            $this->_type = $type;
        }

        public function setCurrentPage($page) {
            $this->_currentPage = $page;
        }

        public function setItemsPerPage($count) {
            $this->itemsPerPage = $count;
        }

        public function setFromDate($date) {
            $this->_fromDate = $date;
        }

        public function setToDate($date) {
            $this->_toDate = $date;
        }

        public function setWorkstation($workstation) {
            $this->workstation = $workstation;
        }

        public function setStore($store) {
            $this->store = $store;
        }

        public function setCashier($cashier) {
            $this->cashier = $cashier;
        }

        public function setConfig_settingsVersion($config_settingsVersion) {
            $this->config_settingsVersion = $config_settingsVersion;
        }

        public function setDocDesignConfig($docDesignConfig) {
            $this->docDesignConfig = $docDesignConfig;
        }

        public function setNetRoundingOff($netRoundingOff) {
            $this->netRoundingOff = $netRoundingOff;
        }

        public function search() {
            if (SYSCONFIG_DB_TYPE == 'MYSQL') {
                include_once('birReports_Queries_MySQL.php');
            } else if (SYSCONFIG_DB_TYPE == 'ORACLE') {
                include_once('birReports_Queries.php');
            }
            
            $queries = new BIRReport_Queries(
                $this->_fromDate, 
                $this->_toDate,
                $this->workstation,
                $this->store,
                $this->cashier
            );

            $ctrl = 0;
            $arr = [
                'results' => [],
                'total' => 0
            ];

            switch ($this->_type) {
                case 'DETAILED_SUMMARY':
                    $sql = $queries->getDailySummaryQuery(true);
                    break;

                case 'SALES_SUMMARY':
                    $sql = $queries->getSalesSummaryQuery(true);
                    break;

                case 'RETURN_REPORT':
                    $sql = $queries->getReturnReportQuery(true);
                    break;

                case 'SENIOR_CITIZENS_DISCOUNT':
                    $sql = $queries->getSeniorCitizenQuery(true);
                    break;

                case 'PWD_DISCOUNT':
                    $sql = $queries->getPWDDiscountQuery(true);
                    break;

                case 'SP_DISCOUNT':
                    $sql = $queries->getSPDiscountQuery(true);
                    break;

                case 'ATHLETE_DISCOUNT':
                    $sql = $queries->getATHLETEDiscountQuery(true);
                    break;

                case 'ZERO_RATED':
                    $sql = $queries->getZeroRatedQuery(true);
                    break;
            }

            if (!isset($sql)) return;

            $offset = ($this->_currentPage - 1) * $this->itemsPerPage;
            $nextRows = $offset + $this->itemsPerPage;                

            if (SYSCONFIG_DB_TYPE == 'MYSQL') {
                $conn = mysqli_connect(SYSCONFIG_DB_MYSQL_HOST, SYSCONFIG_DB_MYSQL_USER, SYSCONFIG_DB_MYSQL_PASS, SYSCONFIG_DB_MYSQL_NAME);

                if ($result = mysqli_query($conn, $sql)) {
                    $arr['total'] = mysqli_num_rows($result);
                }

                mysqli_query($conn, 'SET SESSION group_concat_max_len = 1048576;');
                mysqli_query($conn, 'SET @end := 0;');
                mysqli_query($conn, 'SET @minzcount := 0;');
                mysqli_query($conn, 'SET @zcount := 0;');
                mysqli_query($conn, "SET @prevdate = '1970-01-01';");

                $sql .= ' LIMIT '.$this->itemsPerPage.' OFFSET ' . $offset;
                // echo $sql;
                if ($result = mysqli_query($conn, $sql)) {
                    $arr['results'] =  mysqli_fetch_all($result, MYSQLI_ASSOC);
                }

            } else if (SYSCONFIG_DB_TYPE == 'ORACLE') {
                $result = $this->conn->Execute($sql);
                $arr['total'] = $result->recordCount();

                $sql .= ' OFFSET ' . ($offset) . ' ROWS FETCH NEXT ' . ($nextRows) . ' ROWS ONLY';
                $result = $this->conn->Execute($sql);
                $arr['results'] = $result->GetRows();
            }

            return json_encode($arr);
        }

        public function export()
        {
            if (SYSCONFIG_DB_TYPE == 'MYSQL') {
                include_once('birReports_Queries_MySQL.php');
            } else if (SYSCONFIG_DB_TYPE == 'ORACLE') {
                include_once('birReports_Queries.php');
            }

            $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);

            // set default monospaced font
            $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);

            // set margins
            $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_RIGHT);

            // set auto page breaks
            $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);

            // set font
            $pdf->SetFont('times', '', 8);

            $pdf->AddPage('L', 'A3');

            $from = date_format(date_create($this->_fromDate), 'm/d/Y');
            $to = date_format(date_create($this->_toDate), 'm/d/Y');


            if ($this->config_settingsVersion == 'v2') {
                if (SYSCONFIG_DB_TYPE == 'MYSQL') {
                    $dbName = 'rpsods';
                } else if (SYSCONFIG_DB_TYPE == 'ORACLE') {
                    $dbName = 'RPS';
                }

                $subsidiary = $this->conn->Execute('SELECT * FROM '. $dbName . '.subsidiary sbs WHERE sbs.SID = \'' . $this->request->sbsSID . '\'');

                if (!$subsidiary) {
                    echo "No subsidiary found!";
                    return;
                }

                $store = $this->conn->Execute('SELECT * FROM '. $dbName . '.store store WHERE store.SID = \'' . $this->request->storeSID . '\'');

                if (!$store) {
                    echo "No store found!";
                    return;
                }

                $subsidiary = $subsidiary->GetRowAssoc();
                $store = $store->GetRowAssoc();

                $sbsName = (isset($subsidiary['sbs_name'])) ? $subsidiary['sbs_name'] : '' ;
                $storeName = (isset($store['store_name'])) ? $store['store_name'] : '' ;
                $address1 = (isset($store['address1'])) ? $store['address1'] : '' ;
                $address2 = (isset($store['address2'])) ? $store['address2'] : '' ;
                $address3 = (isset($store['address3'])) ? $store['address3'] : '' ;
                $address4 = (isset($store['address4'])) ? $store['address4'] : '' ;
                $address6 = (isset($store['address6'])) ? $store['address6'] : '' ;

                $udfString1 = (isset($store['udf1_string'])) ? $store['udf1_string'] : '' ;
                $udfString2 = (isset($store['udf2_string'])) ? $store['udf2_string'] : '' ;
                $udfString3 = (isset($store['udf3_string'])) ? $store['udf3_string'] : '' ;
                $udfString4 = (isset($store['udf4_string'])) ? $store['udf4_string'] : '' ;

                $snMin = str_replace(['SN:', 'MIN:'], ['', ''], $udfString2);
                $snMin = explode(" ", $snMin);
$posTerminalNo = ($this->request->workstation != 'all') ? $this->request->wsNo : $this->request->allWorkstationNo;
            // set some text to print
            $txt = "
" . $sbsName . "
" . $storeName . "
" . $address1 . " " . $address2 . " " . $address3 . " " . $address4 . "
VAT Reg TIN: " . $address6 . "
Date Range: " . $from . " - " . $to . "
Serial No.: " . $udfString2 . "
MIN: " . $udfString3 . "
Software Version: " . $this->request->softwareVersion . "
Accreditation No.: " . $udfString1. "
PTU No.: " . $udfString4 . "
User ID: " . $this->request->username . "
POS Terminal No: " . $posTerminalNo . "
            ";
            } else {
                $defaultSBSConfig = [];
                $currentSBSConfig = [];

                $defaultStoreConfig = [];
                $currentStoreConfig = [];

                $defaultWSConfig = [];
                $currentWSConfig = [];

                $defaultSBSConfig = (count($this->docDesignConfig)) ? current((array)$this->docDesignConfig) : [] ;

                foreach ($this->docDesignConfig as $key => $sbs) {

                    if (isset($sbs->subsidiaryNo) && isset($sbs->stores)) {

                        if ($sbs->subsidiaryNo == $this->request->sbsNo) {

                            $currentSBSConfig = $sbs;

                            $defaultStoreConfig = current((array)$sbs->stores);

                            foreach ($sbs->stores as $key => $store) {
                                
                                if (isset($store->storeNo) && isset($store->workstations)) {

                                    if ($store->storeNo == $this->request->storeNo) {

                                        $currentStoreConfig = $store;

                                        $defaultWSConfig = current((array)$store->workstations);

                                        foreach ($store->workstations as $workstation) {

                                            if (isset($workstation->workstationNo)) {
                                                if ($workstation->workstationNo == $this->request->wsNo) {

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

            // set some text to print
            $txt = "
" . $sbsName . "
" . $storeName . "
" . $address1 . " " . $address2 . " " . $address3 . " " . $address4 . "
" . $vatRegTin . "
Date Range: " . $from . " - " . $to . "
" . $serialNumber . "
" . $min . "
" . $sotftwareVersion . "
Accreditation No.: " . $udfString1. "
" . $ptuNo . "
User ID: " . $this->request->username . "
POS Terminal No: " . $posTerminalNo . "
            ";
            }

            // print a block of text using Write()
            $pdf->Write(0, $txt, '', 0, 'C', true, 0, false, false, 0);

            switch ($this->_type) {
                case 'DETAILED_SUMMARY':
                    $pdf->SetTitle('Detailed Sales Summary Report');
                    $this->pdfDetailedSummarySetTable($pdf, $from, $to);
                    break;

                case 'SALES_SUMMARY':
                    $pdf->SetTitle('BIR Sales Summary Report');
                    $this->pdfSalesSummarySetTable($pdf, $from, $to);
                    break;

                case 'RETURN_REPORT':
                    $pdf->SetTitle('Return Report');
                    $this->pdfReturnReportSetTable($pdf, $from, $to);
                    break;

                case 'SENIOR_CITIZENS_DISCOUNT':
                    $pdf->SetTitle('Senior Citizens Discount Report');
                    $this->pdfSeniorCitizenSetTable($pdf, $from, $to);
                    break;

                case 'PWD_DISCOUNT':
                    $pdf->SetTitle('PWD Discount Report');
                    $this->pdfPWDSetTable($pdf, $from, $to);
                    break;

                case 'SP_DISCOUNT':
                    $pdf->SetTitle('Solo Parent Discount Report');
                    $this->pdfSPSetTable($pdf, $from, $to);
                    break;

                case 'ATHLETE_DISCOUNT':
                    $pdf->SetTitle('National Athlete and Coaches (NAAC) Discount Report');
                    $this->pdfATHLETESetTable($pdf, $from, $to);
                    break;

                case 'ZERO_RATED':
                    $pdf->SetTitle('Zero Rated Sales Report');
                    $this->pdfZeroRatedSetTable($pdf, $from, $to);
                    break;

                default:
                    # code...
                    break;
            }

            ob_end_clean();

            $pdf->Output();
        }

        private function pdfDetailedSummarySetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getDailySummaryQuery(false);

            $result = $this->conn->Execute($sql);

            $deductionCount = 0;

            $regulars = [];
            $deductions = [];

            $regularTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            $deductionTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            if ($result) {
                $result = $result->GetRows();
                foreach ($result as $key => $res) {
                    $isDeduction = ($res['receipt_type'] == 1);

                    if ($isDeduction) {
                        foreach ($res as $key => $r) {
                            $res[$key] = ($r <= 0 || ($key == 'INVOICE_NO' || $key == 'CREATED_DATE' || $key == 'REMARKS')) ? $r : $r * -1;
                        }

                        $deductions[] = $res;
                        $deductionTotals = [
                            $deductionTotals[0] + $res['GROSS'],
                            $deductionTotals[1] + $res['TOTAL_FEES'],
                            $deductionTotals[2] + $res['SC_DISC'],
                            $deductionTotals[3] + $res['PWD_DISC'],
                            $deductionTotals[4] + $res['SP_DISC'],
                            $deductionTotals[5] + $res['ATHLETE_DISC'],
                            $deductionTotals[6] + $res['OTHER_DISC'],
                            $deductionTotals[7] + $res['VAT_ADJUSTMENT'],
                            $deductionTotals[8] + $res['NET_AMOUNT'],
                            $deductionTotals[9] + $res['VAT_SALES'],
                            $deductionTotals[10] + $res['VAT_AMOUNT'],
                            $deductionTotals[11] + $res['VAT_EXEMPT'],
                            $deductionTotals[12] + $res['ZERO_RATED'],
                            $deductionTotals[13] + $res['ROUNDING_OFFSET'],
                            $deductionTotals[14] + $res['PAY_CASH'],
                            $deductionTotals[15] + $res['PAY_CARD'],
                            $deductionTotals[16] + $res['PAY_OTHERS']
                        ];
                    } else {
                        $regulars[] = $res;
                        $regularTotals = [
                            $regularTotals[0] + $res['GROSS'],
                            $regularTotals[1] + $res['TOTAL_FEES'],
                            $regularTotals[2] + $res['SC_DISC'],
                            $regularTotals[3] + $res['PWD_DISC'],
                            $regularTotals[4] + $res['SP_DISC'],
                            $regularTotals[5] + $res['ATHLETE_DISC'],
                            $regularTotals[6] + $res['OTHER_DISC'],
                            $regularTotals[7] + $res['VAT_ADJUSTMENT'],
                            $regularTotals[8] + $res['NET_AMOUNT'],
                            $regularTotals[9] + $res['VAT_SALES'],
                            $regularTotals[10] + $res['VAT_AMOUNT'],
                            $regularTotals[11] + $res['VAT_EXEMPT'],
                            $regularTotals[12] + $res['ZERO_RATED'],
                            $regularTotals[13] + $res['ROUNDING_OFFSET'],
                            $regularTotals[14] + $res['PAY_CASH'],
                            $regularTotals[15] + $res['PAY_CARD'],
                            $regularTotals[16] + $res['PAY_OTHERS']
                        ];
                    }
                }
            }

            usort($regulars, function($a, $b) {
                return $a['INVOICE_NO'] - $b['INVOICE_NO'];
            });

            usort($deductions, function($a, $b) {
                return $a['INVOICE_NO'] - $b['INVOICE_NO'];
            });

            require_once('../templates/exportTables/detailed-sales-summary.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfSalesSummarySetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getSalesSummaryQuery(false);

            $result = [];
            if (SYSCONFIG_DB_TYPE == 'MYSQL') {
                $conn = mysqli_connect(SYSCONFIG_DB_MYSQL_HOST, SYSCONFIG_DB_MYSQL_USER, SYSCONFIG_DB_MYSQL_PASS, SYSCONFIG_DB_MYSQL_NAME);
                mysqli_query($conn, 'SET SESSION group_concat_max_len = 1048576;');
                mysqli_query($conn, 'SET @end := 0;');
                mysqli_query($conn, 'SET @minzcount := 0;');
                mysqli_query($conn, 'SET @zcount := 0;');
                mysqli_query($conn, "SET @prevdate = '1970-01-01';");

                if ($res = mysqli_query($conn, $sql)) {
                    $result =  mysqli_fetch_all($res, MYSQLI_ASSOC);
                }
            } else if (SYSCONFIG_DB_TYPE == 'ORACLE') {
                $result = $this->conn->Execute($sql);
            }

            require_once('../templates/exportTables/sales-summary.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfReturnReportSetTable($pdf)
        {

            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getReturnReportQuery(false);

            $result = $this->conn->Execute($sql);
 //            print_r($result);
 // die($sql);
            require_once('../templates/exportTables/return-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfSeniorCitizenSetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getSeniorCitizenQuery(false);

            $result = $this->conn->Execute($sql);

            require_once('../templates/exportTables/senior-citizens-discount-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfPWDSetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getPWDDiscountQuery(false);

            $result = $this->conn->Execute($sql);

            require_once('../templates/exportTables/pwd-discount-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfSPSetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getSPDiscountQuery(false);

            $result = $this->conn->Execute($sql);

            require_once('../templates/exportTables/sp-discount-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }
        private function pdfATHLETESetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getATHLETEDiscountQuery(false);

            $result = $this->conn->Execute($sql);

            require_once('../templates/exportTables/athlete-discount-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

        private function pdfZeroRatedSetTable($pdf)
        {
            $queries = new BIRReport_Queries($this->_fromDate, $this->_toDate, $this->workstation, $this->store, $this->cashier);
            $sql = $queries->getZeroRatedQuery(false);

            $result = $this->conn->Execute($sql);

            require_once('../templates/exportTables/zero-rated-report.php');

            $pdf->writeHTML($html, true, false, false, false, '');
        }

    }
?>
