<?php $html = '
<table border="1" cellpadding="2">
	<tr class="tr-head">
        <th align="center" style="text-transform: uppercase; background-color: #AAA;" colspan="28"><strong>'. strtoupper('BIR Sales Summary Report') .'</strong></th>
    </tr>
    <tr class="tr-head">
        <th align="center" rowspan="2">Date</th>
        <th align="center" rowspan="2">From</th>
        <th align="center" rowspan="2">To</th>
        <th align="center" align="center" colspan="2">Balance (at net)</th>
        <th align="center" rowspan="2">Net Amount</th>
        <th align="center" align="center" colspan="5">Discounts</th>
        <th align="center" rowspan="2">Return</th>
        <th align="center" rowspan="2">Refund</th>
        <th align="center" rowspan="2">Voids</th>
        <th align="center" rowspan="2">VAT Adjustments</th>
        <th align="center" rowspan="2">Total Income</th>
        <th align="center" rowspan="2">Other Income</th>
        <th align="center" rowspan="2">Gross Amount</th>
        <th align="center" rowspan="2">Vatable Sales</th>
        <th align="center" rowspan="2">VAT Amount</th>
        <th align="center" rowspan="2">VAT Exempt*</th>
        <th align="center" rowspan="2">Zero-Rated</th>
        <th align="center" rowspan="2">VAT Payable</th>
        <th align="center" rowspan="2">Sales Overrun</th>
        <th align="center" rowspan="2">Total Sales</th>
        <th align="center" rowspan="2">Reset Counter</th>
        <th align="center" rowspan="2">Z-Counter</th>
        <th align="center" rowspan="2">Remarks</th>
    </tr>
    <tr class="tr-head">
        <th align="center">Beginning</th>
        <th align="center">Ending</th>
        <th align="center">SC</th>
        <th align="center">PWD</th>
        <th align="center">SP</th>
        <th align="center">NAAC</th>
        <th align="center">OTHERS</th>
    </tr>';

if (count($result)) {
	foreach ($result as $key => $res) {
	    $html .=
	        '<tr>
	            <td align="center">' . $res['CREATED_DATE'] . '</td>
	            <td align="center">' . $res['MIN_INVOICE_NO'] . '</td>
	            <td align="center">' . $res['MAX_INVOICE_NO'] . '</td>
	            <td align="right">' . number_format((float) $res['BEGINNING'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['ENDING'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['NET_AMOUNT'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['SC_DISC'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['PWD_DISC'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['SP_DISC'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['ATHLETE_DISC'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['OTHER_DISC'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['RETURNS'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) 0, 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VOIDS'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VAT_ADJUSTMENT'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['TOTAL_INCOME'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['OTHER_INCOME'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['GROSS_INCOME'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VAT_SALES'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VAT_AMOUNT'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VAT_EXEMPT'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['ZERO_RATED'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['VAT_PAYABLE'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) 0, 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) $res['TOTAL_SALES'], 2, '.', '') . '</td>
	            <td align="right">' . number_format((float) 0, 2, '.', '') . '</td>
	            <td align="right">' . $res['ZCOUNT_SEQUENCE'] . '</td>
	            <td align="center"></td>
	        </tr>
	    ';
	}
}

$html .= '</table>'; ?>