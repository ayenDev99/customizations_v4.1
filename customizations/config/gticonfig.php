<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

    // Define MYSQL Database Credentials
    define('SYSCONFIG_DB_MYSQL_HOST', 'localhost');
    define('SYSCONFIG_DB_MYSQL_USER', 'root');
    define('SYSCONFIG_DB_MYSQL_PASS', 'sysadmin');
    define('SYSCONFIG_DB_MYSQL_NAME', 'rpsods');

    // Define the type of database to use in the application
    define('SYSCONFIG_DB_TYPE', 'MYSQL');

    /*PRINTER SET UP-------------------------------------------------------------*/
    // Port # => Printer Name
    // Don't remove default printer
    $printerSetup = [
        'default' => 'POS1',
        '8080' => 'POS1',
        '8081' => 'POS1',
        '8082' => 'POS2',
        '8083' => 'POS3',
        '8084' => 'EPSON TM-U220 Receipt',
        '8085' => 'EPSON TM-U220 Receipt',
        '8086' => 'EPSON TM-U220 Receipt',
        '8087' => 'EPSON TM-U220 Receipt',
        '8088' => 'EPSON TM-U220 Receipt',
        '8089' => 'EPSON TM-U220 Receipt',
        '8090' => 'EPSON TM-U220 Receipt',
        '8091' => 'EPSON TM-U220 Receipt',
        '8092' => 'EPSON TM-U220 Receipt',
        '8093' => 'EPSON TM-U220 Receipt',
        '8094' => 'EPSON TM-U220 Receipt'
    ];
    /*---------------------------------------------------------------------------*/
    
    /*DUPMING SETUP-------------------------------------------------------------*/
    define('DUMPING_PER_TRANSACTION_ENABLE', false);
    define('DUMPING_CLOSE_DRAWER_ENABLE', false);
    define('DUMPING_CHECK_RECUPDATE_ENABLE', false);
    define('DUMPING_PATH', 'D:\Prism Mall Dumping');
    define('DUMPING_RECUPDATE_PATH', DUMPING_PATH . '\recupdate.ini');
    define('DUMPING_EXE', 'OracleConnect.exe');
    /*---------------------------------------------------------------------------*/

    /*PASSCODE SETUP FOR Z-READING-----------------------------------------------*/
    define('PASSCODE_ENABLE', false);
    /*---------------------------------------------------------------------------*/

	/*CUSTOMER DISPLAY CONFIG---------------------------------------------------*/
    define('SYSCONFIG_CUSTOMERDISPLAY_FILE_PATH','C:\\');
    define('SYSCONFIG_CUSTOMERDISPLAY_MULTIFILE_PATH','http://hd-ag4-pos-serv:8080=|=C:\\|0|http://nb014.gti.com.ph:8080=|=C:\ProgramData|0|http://nb012.gti.com.ph:8081=|=C:\ProgramData');/*set here the string values that url and filepath for server e.g nb012.gti.com.ph:8080=|=C:\\ means C:\\ will be the filepath for nb012.gti.com.ph:8080 then |0| will be the next server */
    $multidisplay = [
        '8080' => 'C:\CUST\8080',
        '8081' => 'C:\CUST\8081',
        '8082' => 'C:\CUST\8082',
    ];
/*------------------------------------------------------------------------*/

    /*QTS---------------------------------------------------------------------------*/
    define('SYSCONFIG_QTS_ENABLED', false);
    define('SYSCONFIG_QTS_DB_MYSQL_HOST', 'localhost');
    define('SYSCONFIG_QTS_DB_MYSQL_PORT', 3307);
    define('SYSCONFIG_QTS_DB_MYSQL_USER', 'root');
    define('SYSCONFIG_QTS_DB_MYSQL_PASS', '');
    define('SYSCONFIG_QTS_DB_MYSQL_NAME', 'prism_qts');
    
    if (SYSCONFIG_QTS_ENABLED) {
        try {
            $conn_qts = NewADOConnection('mysqli');
            $conn_qts->port = SYSCONFIG_QTS_DB_MYSQL_PORT;
            $conn_qts->Connect(SYSCONFIG_QTS_DB_MYSQL_HOST, SYSCONFIG_QTS_DB_MYSQL_USER, SYSCONFIG_QTS_DB_MYSQL_PASS, SYSCONFIG_QTS_DB_MYSQL_NAME);
        } catch (Exception $e) {
            http_response_code(500);
            throw new Exception("Unable to connect to the database");
        }
    } else {
        $conn_qts = null;
    }

    $QTSPrinterSetup = [
        'default' => [
            '1to1' => 'BIXOLON',
            '1toAll' => 'BIXOLON'
        ],
        '8080' => [
            '1to1' => 'BIXOLON',
            '1toAll' => 'BIXOLON'
        ],
        '8081' => [
            '1to1' => 'BIXOLON',
            '1toAll' => 'BIXOLON'
        ]
    ];
    /*---------------------------------------------------------------------------*/
    define('PROGRAM_CODE_1', 'prism_bir_plugins_v4');

    define('APPLICATION_NAME', 'PRISM BIR PLUGIN');
    define('APPLICATION_VERSION', '2.0');

    $conn = NULL;
    if(SYSCONFIG_DB_TYPE == 'MYSQL'):
        $conn    = NewADOConnection('mysqli');
        $conn->Connect(SYSCONFIG_DB_MYSQL_HOST, SYSCONFIG_DB_MYSQL_USER, SYSCONFIG_DB_MYSQL_PASS, SYSCONFIG_DB_MYSQL_NAME);
    elseif(SYSCONFIG_DB_TYPE == 'ORACLE'):
        $conn    = NewADOConnection('oci8');
        $conn->Connect(SYSCONFIG_DB_ORACLE_HOST, SYSCONFIG_DB_ORACLE_USER, SYSCONFIG_DB_ORACLE_PASS, SYSCONFIG_DB_ORACLE_NAME);
    endif;

    date_default_timezone_set('Asia/Manila'); //TIMEZONE
    header('Access-Control-Allow-Origin: *');

?>