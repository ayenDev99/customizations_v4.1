<?php $html = '
<table border="1" cellpadding="2">
    <tr class="tr-head">
        <th align="center" style="text-transform: uppercase; background-color: #AAA;" colspan="19"><strong>'. strtoupper('Return Report') .'</strong></th>
    </tr>
    <tr class="tr-head">
        <th style="font-weight: bold;" align="center" rowspan="2">Date</th>
        <th style="font-weight: bold;" align="center" rowspan="2">SI #</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Gross</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Other Charges</th>
        <th style="font-weight: bold;" align="center" align="center" colspan="5">Discounts</th>
        <th style="font-weight: bold;" align="center" rowspan="2">VAT Adj.</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Net Sales</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Vatable Sales</th>
        <th style="font-weight: bold;" align="center" rowspan="2">VAT Amount</th>
        <th style="font-weight: bold;" align="center" rowspan="2">VAT Exempt Sales</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Zero Rated Sales</th>
        <th style="font-weight: bold;" align="center" align="center" colspan="3">Mode Of Payment</th>
        <th style="font-weight: bold;" align="center" rowspan="2">Remarks</th>
    </tr>
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

if (count($result)) {
    foreach ($result as $key => $res) {
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
                <td align="right">' . number_format((float) $res['ZERO_RATED'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PAY_CASH'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PAY_CARD'], 2, '.', '') . '</td>
                <td align="right">' . number_format((float) $res['PAY_OTHERS'], 2, '.', '') . '</td>
                <td>' . $res['REMARKS'] . '</td>
            </tr>
        ';
    }
}

$html .= '</table>';
?>

