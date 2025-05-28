<?php
    require_once('../../libraries/adodb5/adodb.inc.php');
    require_once('../../config/gticonfig.php');
    date_default_timezone_set('Asia/Manila'); //TIMEZONE
    require_once('../../libraries/escpos-php/autoload.php');
    use Mike42\Escpos\Printer;
    use Mike42\Escpos\EscposImage;
    use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
    use Mike42\Escpos\CapabilityProfile;

    if($_SERVER['REQUEST_METHOD'] == 'POST'):
        $postdata   = file_get_contents("php://input");
        $request    = json_decode($postdata);
        switch ($request->action):
            case 'print':
                echo print_qts($request, $QTSPrinterSetup);
                break;
        endswitch;
    endif;


    // This method will print XOut or ZOut
    function print_qts($request, $QTSPrinterSetup) {

        $printer_path = null;

        if (isset($QTSPrinterSetup[$request->port])) {
            $printer_path = $QTSPrinterSetup[$request->port][$request->type];
        } else {
            $printer_path = $QTSPrinterSetup['default'][$request->type];
        }

        $profile = CapabilityProfile::load("simple");
        $connector = new WindowsPrintConnector($printer_path);
        $printer = new Printer($connector, $profile);

        $currentY = 0;
        $texts = [];

        $oneColumnTextsWithFeed = [
            'cashier', 'z-count:', 'x-reading'
        ];

        foreach ($request->data[0]->content as $sub_key => $sub_value) {

            if ($sub_key == 0 && $sub_value->data == "") continue;

                if ($sub_key == 0) $currentY = $sub_value->y;

                if ($currentY != $request->data[0]->content[$sub_key + 1]->y) {
                    switch (count($texts)) {
                        case 0:
                            $space_count = (40 - strlen($sub_value->data)) / 2;
                            $space = "";
                            for ($i=0; $i < $space_count; $i++):
                                $space .= ' ';
                            endfor;
                            $printer->text($space . $sub_value->data . "\n");
                            foreach ($oneColumnTextsWithFeed as $k => $t) {
                               if (strpos(strtolower($sub_value->data), $t) !== false) {
                                    $printer->feed(1);
                               }
                            }
                            break;
                        
                        case 1:
                            $texts[] = $sub_value->data;

                            $str_length = strlen($texts[0].$texts[1]);
                            $spaces = '';
                            $spaceCnt = 40 - $str_length;
                            for ($i = 1; $i <= $spaceCnt; $i++) {
                                $spaces .= ' ';
                            }

                            $printer->text($texts[0] . $spaces . $texts[1] . "\n");

                            break;
                    }

                    $currentY = $request->data[0]->content[$sub_key + 1]->y;
                    $texts = [];
                } else {
                    $texts[] = $sub_value->data;
                }
        }

        $printer->feed(10);
        $printer->cut();

        $printer->close();
    }