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

    $XZOutReport = new XZOutReport($conn);

    switch ($request->action) {
        case 'generate':
            echo $XZOutReport->generate($request);
            break;

        case 'show':
            echo $XZOutReport->show();
            break;
    }

    class XZOutReport {
        private $conn;

        function __construct($conn) {
            $this->conn = $conn;
        }


        public function generate($request) {
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
            $pdf->SetFont('times', '', 7);

            $pdf->AddPage();

            // set some text to print
            // $txt = "TEST";

            // print a block of text using Write()
            // $pdf->Write(0, $txt, '', 0, 'L', true, 0, false, false, 0);

            $width = 40;


            $html = '
                <table cellpadding="2" border="0">
            ';

            $tempContents = [];

            foreach ($request->data->content as $key => $content) {
                if (!isset($tempContents[$content->y])) {
                    $tempContents[$content->y] = [];
                }

                $tempContents[$content->y][] = $content->data;
            }
            // print_r($tempContents);
            foreach ($tempContents as $key => $data) {
                if (count($data) == 1) {
                    $html .= '
                        <tr>
                            <td colspan="2" align="center"><strong>' . $data[0] . '</strong></td>
                        </tr>
                    ';
                } else {
                    $html .= '
                        <tr>
                            <td>' . $data[0] . '</td>
                            <td align="right">' . $data[1] . '</td>
                        </tr>
                    ';
                }
            }

            $html .= '
                </table>
            ';

            // print_r($html);

            $pdf->writeHTML($html, true, false, false, false, '');

            $pdf->Output('C:\ProgramData\RetailPro\Server\WebClient\customizations\plugins\PLXZoutPreview\xzout.pdf', 'F');
        }

        public function show()
        {
            
        }

    }
?>
