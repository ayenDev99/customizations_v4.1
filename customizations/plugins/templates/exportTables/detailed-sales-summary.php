<?php $html = '
<table border="1" cellpadding="2">
    <tr class="tr-head">
        <th align="center" style="text-transform: uppercase; background-color: #AAA;" colspan="19"><strong>'. strtoupper('Detailed Sales Summary Report') .'</strong></th>
    </tr>
    <tr class="tr-head">
        <th style="font-weight: bold;" align="center" rowspan="2">Date</th>
        <th style="font-weight: bold;" align="center" rowspan="2">SI #</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">Gross</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">Other Charges</th>
        <th style="font-weight: bold;" align="center" align="center" colspan="5" width="230">Discounts</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">VAT Adjustments</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">Net Amount <br> (Total Amount due)</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">Vatable Sales</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">VAT Amount</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">VAT Exempt Sales</th>
        <th style="font-weight: bold;" align="center" rowspan="2" width="60">Zero Rated Sales</th>';
        
        if ($this->netRoundingOff != 'false') {
            $html .= '<th style="font-weight: bold;" align="center" rowspan="2" width="60">Net Rounding Amount</th>';
        }

    $html.= '<th style="font-weight: bold;" align="center" align="center" colspan="3">Mode Of Payment</th>';
        
    if ($this->netRoundingOff != 'false') {
        $html .= '<th style="font-weight: bold;" align="center" rowspan="2">Remarks</th>';
    } else {
        $html .= '<th style="font-weight: bold;" align="center" rowspan="2" width="105">Remarks</th>';
    }

    $html .= '</tr>
    <tr class="tr-head">
        <th style="font-weight: bold;" align="center">SC</th>
        <th style="font-weight: bold;" align="center">PWD</th>
        <th style="font-weight: bold;" align="center">SP</th>
        <th style="font-weight: bold;" align="center">NAAC</th>
        <th style="font-weight: bold;" align="center">Others</th>
        <th style="font-weight: bold;" align="center">Cash</th>
        <th style="font-weight: bold;" align="center">Credit Card</th>
        <th style="font-weight: bold;" align="center">Others</th>
    </tr>';

if (count($regulars)) {
    foreach ($regulars as $key => $res) {
        $html .=
            '<tr>
                <td align="center">' . $res['CREATED_DATE'] . '</td>
                <td align="center">' . $res['INVOICE_NO'] . '</td>
                <td align="right">' . number_format((float) $res['GROSS'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['TOTAL_FEES'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['SC_DISC'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PWD_DISC'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['SP_DISC'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['ATHLETE_DISC'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['OTHER_DISC'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['VAT_ADJUSTMENT'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['NET_AMOUNT'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['VAT_SALES'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['VAT_AMOUNT'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['VAT_EXEMPT'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['ZERO_RATED'], 2, '.', '') . '</td>';

                if ($this->netRoundingOff != 'false') {
                    $html .= '<td align="right">' . number_format((float) $res['ROUNDING_OFFSET'], 2, '.', '') . '</td>';
                }

            $html .=  '<td align="right">' . number_format((float) $res['PAY_CASH'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PAY_CARD'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PAY_OTHERS'], 2, '.', '') . '</td>
                <td>' . $res['REMARKS'] . '</td>
            </tr>
        ';
    }

    $html .= '
            <tr>
                <td colspan="2" style="background-color: #eee;"><strong>TOTALS</strong></td>';

            foreach ($regularTotals as $key => $total) {
                if ($this->netRoundingOff == 'false' && $key == 13) {
                    continue;
                }
                $html .= '<td align="right" style="background-color: #eee;">' . number_format((float) $total, 2, '.', '') . '</td>';
            }

    $html .= '
                <td style="background-color: #eee;"></td>    
            </tr>';
}

$html .= '
        </tbody>
    </table><br/><br/><br/>';

if (count($deductions)) {
    $html .= '
        <table border="1" cellpadding="2">
            <tbody> 
                <tr><td colspan="19"><strong>DEDUCTION</strong></td></tr>';

                foreach ($deductions as $key => $res) {
                    $html .=
                        '<tr>
                            <td align="center">' . $res['CREATED_DATE'] . '</td>
                            <td align="center">' . $res['INVOICE_NO'] . '</td>
                            <td align="right" width="60">' . number_format((float) $res['GROSS'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['TOTAL_FEES'], 2, '.', '') . '</td>
                            <td align="right" width="46">' . number_format((float) $res['SC_DISC'], 2, '.', '') . '</td>
                            <td align="right" width="46">' . number_format((float) $res['PWD_DISC'], 2, '.', '') . '</td>
                            <td align="right" width="46">' . number_format((float) $res['SP_DISC'], 2, '.', '') . '</td>
                            <td align="right" width="46">' . number_format((float) $res['ATHLETE_DISC'], 2, '.', '') . '</td>
                            <td align="right" width="46">' . number_format((float) $res['OTHER_DISC'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['VAT_ADJUSTMENT'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['NET_AMOUNT'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['VAT_SALES'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['VAT_AMOUNT'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['VAT_EXEMPT'], 2, '.', '') . '</td>
                            <td align="right" width="60">' . number_format((float) $res['ZERO_RATED'], 2, '.', '') . '</td>';

                            if ($this->netRoundingOff != 'false') {
                                $html .= '<td align="right" width="60">' . number_format((float) $res['ROUNDING_OFFSET'], 2, '.', '') . '</td>';
                            }

                        $html .= '<td align="right">' . number_format((float) $res['PAY_CASH'], 2, '.', '') . '</td>
                            <td align="right">' . number_format((float) $res['PAY_CARD'], 2, '.', '') . '</td>
                            <td align="right">' . number_format((float) $res['PAY_OTHERS'], 2, '.', '') . '</td>';

                            if ($this->netRoundingOff != 'false') {
                                $html .= '<td>' . $res['REMARKS'] . '</td>';
                            } else {
                                $html .= '<td width="105">' . $res['REMARKS'] . '</td>';
                            } 
                            
                        $html .= '</tr>
                    ';
                }


            $html .= '
                <tr>
                    <td colspan="2" style="background-color: #eee;"><strong>TOTAL DEDUCTION</strong></td>';

                foreach ($deductionTotals as $key => $total) {
                    if ($this->netRoundingOff == 'false' && $key == 13) {
                        continue;
                    }
                    $html .= '<td align="right" style="background-color: #eee;">' . number_format((float) $total, 2, '.', '') . '</td>';
                }

            $html .= '
                        <td style="background-color: #eee;"></td>    
                    </tr>';

    $html .= '
            </tbody>
        </table><br/><br/><br/>';
}

if (count($deductions) || count($regulars)) {
    $html .= '
        <table border="1" cellpadding="2">
            <tbody>
                <tr>
                    <td colspan="2" style="background-color: #eee;" width="115"><strong>NET</strong></td>';

                    foreach ($regularTotals as $keyT => $t) {
                        if ($this->netRoundingOff == 'false' && $keyT == 13) {
                            continue;
                        }

                        $t += $deductionTotals[$keyT];
                        if ($keyT == 2 || $keyT == 3 || $keyT == 4 || $keyT == 5 || $keyT == 6) {
                            $html .= '<td align="right" style="background-color: #eee;" width="46">' . number_format((float) $t, 2, '.', '') . '</td>';
                        } else {
                            $html .= '<td align="right" style="background-color: #eee;" width="60">' . number_format((float) $t, 2, '.', '') . '</td>';
                        }
                        
                    }

                    if ($this->netRoundingOff != 'false') {
                        $html .= '<td style="background-color: #eee;" width="46"></td>';
                    } else {
                        $html .= '<td style="background-color: #eee;" width="100"></td>';
                    }

            $html .= '
                </tr>
            </tbody>
        </table>';
}
?>

