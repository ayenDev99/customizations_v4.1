<?php
    class BIRReport_Queries {

        private $fromDate;
        private $toDate;
        private $workstation;
        private $store;
        private $cashier;

        function __construct(
                $fromDate, 
                $toDate,
                $workstation,
                $store,
                $cashier

                // $fromDate = null, 
                // $toDate = null,
                // $singleDate = null,
                // $workstation = 'all',
                // $store = 'all',
                // $cashier = 'all'
            )
        {
            $this->fromDate = $fromDate;
            $this->toDate = $toDate;
            $this->workstation = $workstation;
            $this->store = $store;
            $this->cashier = $cashier;
        }

        public function getDailySummaryQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.SP_DISC
                            END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }

        public function getSalesSummaryQuery($isReadOnly)
        {
            $from = date_format(date_create($this->fromDate), 'Y-m-d');
            $to = date_format(date_create($this->toDate), 'Y-m-d');

            $sql = "
                SELECT
                    (@beg:=A.PREV_NET_AMOUNT) AS BEGINNING,
                    (@end:=@beg + A.NET_AMOUNT) AS ENDING,
                    A.*,
                    A.NET_AMOUNT AS TOTAL_INCOME,
                    (A.OTHER_INCOME + A.TOTAL_FEES) AS OTHER_INCOME,
                    A.GROSS AS GROSS_INCOME,
                    A.VAT_AMOUNT AS VAT_PAYABLE,
                    (A.VAT_SALES + A.VAT_EXEMPT + A.ZERO_RATED) AS TOTAL_SALES,
                    -- (@minzcount:=@zcount) AS MIN_ZCOUNTER,
                            
                    (@prevdate:=(
                        CASE WHEN (@prevdate = '1970-01-01') THEN
                            DATE_FORMAT(A.invc_post_date, '%Y-%m-%d') ELSE @prevdate END
                        ))
                     AS PREV_PREV_DATE,

                    (
                        SELECT
                            COUNT(*)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            DATE_FORMAT(Z.period_begin, '%Y-%m-%d') < DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                    ) AS MIN_ZCOUNTER,

                    (@zcount:=(
                        SELECT
                            COUNT(*)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            (@prevdate > DATE_FORMAT(Z.period_begin, '%Y-%m-%d') OR
                            DATE_FORMAT(Z.period_begin, '%Y-%m-%d') <= DATE_FORMAT(A.invc_post_date, '%Y-%m-%d'))
                    )) AS ZCOUNTER,

                    (
                        SELECT
                            GROUP_CONCAT(DISTINCT sequence ORDER BY sequence ASC SEPARATOR ',')
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            DATE_FORMAT(Z.period_begin, '%Y-%m-%d') = DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')" .
                            (($this->workstation != 'all' AND $this->workstation != '') ? ' AND Z.workstation_sid = ' . $this->workstation : '') . 
                            (($this->cashier != 'all' AND $this->cashier != '') ? ' AND Z.cashier_sid = ' . $this->cashier : '') .

                    ") AS ZCOUNT_SEQUENCE,

                    (@prevdate:=DATE_FORMAT(A.invc_post_date, '%Y-%m-%d'))
                FROM
                    (
                        SELECT  
                            A.CREATED_DATE,
                            A.INVOICE_NO,           

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.GROSS)
                            END) AS GROSS,

                            0 AS OTHER_CHARGES,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.SC_DISC
                            END) AS SC_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PWD_DISC
                            END) AS PWD_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.SP_DISC
                            END) AS SP_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.ATHLETE_DISC
                            END) AS ATHLETE_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.OTHER_DISC
                            END) AS OTHER_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.VAT_ADJUSTMENT
                            END) AS VAT_ADJUSTMENT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.NET_AMOUNT
                            END) AS NET_AMOUNT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag <> 1) THEN
                                    (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                                ELSE 0 END)
                            END) AS VAT_SALES,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag <> 1) THEN
                                    ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                                ELSE 0 END)
                            END) AS VAT_AMOUNT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                                    A.GROSS
                                ELSE 
                                    (A.NON_VAT_ITEMS_ORIG_NET)
                                END)
                            END) AS VAT_EXEMPT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                                    A.NET_AMOUNT
                                ELSE 0 END)
                            END) AS ZERO_RATED,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_CASH
                            END) AS PAY_CASH,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_CARD
                            END) AS PAY_CARD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_OTHERS
                            END) AS PAY_OTHERS,

                            (CASE WHEN A.receipt_type = 1 THEN '' ELSE 
                                CASE WHEN A.receipt_type = 2 THEN '' ELSE '' END 
                            END) AS REMARKS,

                            COALESCE((
                                SELECT 
                                    SUM(CASE WHEN (doc.receipt_type = 2) THEN 0 ELSE
                                        (doc.transaction_total_amt) 
                                    END)
                                FROM 
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3) AND 
                                    DATE_FORMAT(doc.invc_post_date, '%Y-%m-%d') < DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')" .
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                            "), 0) AS PREV_NET_AMOUNT,

                            (
                                SELECT 
                                    LPAD(MIN(doc.DOC_NO), 7, '0')
                                FROM
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3)
                                    AND (doc.DOC_NO IS NOT NULL)
                                    AND (receipt_type = 0 OR receipt_type = 2)
                                    AND DATE_FORMAT(doc.invc_post_date, '%Y-%m-%d') = DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')" .
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                                " LIMIT 1
                            ) AS MIN_INVOICE_NO,

                            (
                                SELECT 
                                    LPAD(MAX(doc.DOC_NO), 7, '0')
                                FROM
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3)
                                    AND (doc.DOC_NO IS NOT NULL)
                                    AND (receipt_type = 0 OR receipt_type = 2)
                                    AND DATE_FORMAT(doc.invc_post_date, '%Y-%m-%d') = DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')" .
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                                " LIMIT 1
                            ) AS MAX_INVOICE_NO,

                            ABS(SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.RETURNS_GROSS)
                            END)) AS RETURNS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.VOIDS)
                            END) AS VOIDS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.OTHER_INCOME)
                            END) AS OTHER_INCOME,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.FEES
                            END) AS TOTAL_FEES,
                            
                            A.receipt_type,
                            A.status,
                            A.doc_no,
                            A.invc_post_date,
                            A.store_sid,
                            A.workstation_uid,
                            A.employee1_sid
                        FROM
                            (
                                SELECT
                                    A.*,
                                    A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                                FROM
                                    (
                                        SELECT
                                            DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                            LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                            (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                            
                                            B.GROSS,
                                            B.ADJUSTED_GROSS,
                                            
                                            (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SC_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS PWD_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SP_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS ATHLETE_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                                    CASE WHEN (A.detax_flag = 1) THEN
                                                        ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    ELSE 
                                                        (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    END
                                            ELSE 0 END) AS OTHER_DISC,

                                            (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                                    CASE WHEN (A.detax_flag = 1) THEN
                                                        0
                                                    ELSE 
                                                        (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    END
                                            ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                            B.NET_AMOUNT AS ITEMS_NET,
                                            B.NON_VAT_ITEMS_NET,
                                            COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                            B.VAT_ITEMS_NET,

                                            A.transaction_total_amt AS NET_AMOUNT,

                                            C.PAY_CASH,
                                            C.PAY_CARD,
                                            C.PAY_OTHERS,
                                            C.OTHER_INCOME,

                                            B.RETURNS_GROSS,
                                            B.VOIDS,

                                            A.receipt_type,
                                            A.status,
                                            A.detax_flag,
                                            A.discount_reason_name,
                                            A.doc_no,
                                            A.invc_post_date,
                                            A.workstation_uid,
                                            A.store_sid,
                                            A.employee1_sid,
                                            A.disc_amt
                                        FROM
                                            rpsods.document A
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    sid,
                                                    doc_sid,
                                                    SUM((CASE WHEN (B.item_type <> 2) THEN (B.orig_price * B.qty) ELSE 0 END)) AS GROSS,
                                                    SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS ADJUSTED_GROSS,                    
                                                    SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code = 1) THEN  
                                                            (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS NON_VAT_ITEMS_NET,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code = 1) THEN  
                                                            (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS NON_VAT_ITEMS_ORIG_NET,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code <> 1) THEN  
                                                            (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS VAT_ITEMS_NET,

                                                    SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.item_type = 2) THEN (B.orig_price * B.qty) ELSE 0 END) * -1) AS RETURNS_GROSS,

                                                    SUM(CASE WHEN (B.item_type = 5) THEN (B.price * B.qty) ELSE 0 END) AS VOIDS
                                                FROM
                                                    rpsods.document_item B
                                                LEFT JOIN
                                                    (
                                                        SELECT
                                                            doc_item_sid,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                        FROM
                                                            rpsods.document_item_disc C
                                                        GROUP BY
                                                            C.doc_item_sid
                                                    ) C ON (C.doc_item_sid = B.sid)
                                                GROUP BY
                                                    B.doc_sid
                                            ) B ON A.sid = B.doc_sid
                                        LEFT JOIN
                                        (
                                            SELECT 
                                                E.doc_sid,
                                                SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                                SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                                SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS,
                                                0 AS OTHER_INCOME
                                            FROM
                                                rpsods.document D
                                            LEFT JOIN 
                                                rpsods.tender E ON (D.sid = E.doc_sid)
                                            GROUP BY
                                                E.doc_sid
                                        ) C ON (A.sid = C.doc_sid)
                                    ) A
                                ) A
                        WHERE
                            (A.status = 4
                            OR A.status = 3)
                            AND A.doc_no IS NOT NULL
                            AND DATE_FORMAT(A.invc_post_date, '%Y-%m-%d') BETWEEN '$from' AND '$to'";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }
            
            $sql .= "
                        GROUP BY
                            DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                        ORDER BY 
                            DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                    ) A
            ";

                // echo "<pre>$sql";

            return $sql;
        }      

        public function getReturnReportQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0)  + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND A.receipt_type = 1
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }
            
            // echo "<pre>$sql";

            return $sql;
        }

        public function getSeniorCitizenQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND (A.SC_DISC <> 0)
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }

        public function getPWDDiscountQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND (A.PWD_DISC <> 0)
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }

        public function getSPDiscountQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND (A.SP_DISC <> 0)
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }

        public function getATHLETEDiscountQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND (A.ATHLETE_DISC <> 0)
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }

        public function getZeroRatedQuery($isReadOnly)
        {
            $sql = "
                SELECT  
                    A.CREATED_DATE,
                    A.INVOICE_NO,

                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS CUST_NAME,
                    A.info2 AS CUST_NO,           

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (A.GROSS)
                    END) AS GROSS,

                    0 AS OTHER_CHARGES,

                    A.FEES AS TOTAL_FEES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SC_DISC
                    END) AS SC_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PWD_DISC
                    END) AS PWD_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.SP_DISC
                    END) AS SP_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.ATHLETE_DISC
                    END) AS ATHLETE_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.OTHER_DISC
                    END) AS OTHER_DISC,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.VAT_ADJUSTMENT
                    END) AS VAT_ADJUSTMENT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.NET_AMOUNT
                    END) AS NET_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                        ELSE 0 END)
                    END) AS VAT_SALES,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag <> 1) THEN
                            ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                        ELSE 0 END)
                    END) AS VAT_AMOUNT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                            A.GROSS
                        ELSE 
                            (A.NON_VAT_ITEMS_ORIG_NET)
                        END)
                    END) AS VAT_EXEMPT,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                            A.NET_AMOUNT
                        ELSE 0 END)
                    END) AS ZERO_RATED,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CASH
                    END) AS PAY_CASH,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_CARD
                    END) AS PAY_CARD,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                        A.PAY_OTHERS
                    END) AS PAY_OTHERS,

                    (CASE WHEN A.receipt_type = 1 THEN 'Return' ELSE 
                        CASE WHEN A.receipt_type = 2 THEN 'Sales Order' ELSE '' END 
                    END) AS REMARKS,

                    (CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                        A.rounding_offset
                    END) AS ROUNDING_OFFSET,

                    A.receipt_type,
                    A.status,
                    A.doc_no,
                    A.invc_post_date,
                    A.bt_cuid,
                    A.workstation_uid,
                    A.store_sid,
                    A.employee1_sid
                FROM
                    (
                        SELECT
                            A.*,
                            A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                        FROM
                            (
                                SELECT
                                    DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                    LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                    (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                    
                                    COALESCE(B.GROSS, 0) AS GROSS,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        ELSE 
                                            ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC,

                                    (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                        CASE WHEN (A.detax_flag = 1) THEN
                                            0
                                        ELSE 
                                            (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                        END
                                    ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                            END
                                    ELSE 0 END) AS OTHER_DISC,

                                    (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                            CASE WHEN (A.detax_flag = 1) THEN
                                                0
                                            ELSE 
                                                (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12)
                                            END
                                    ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                    B.NET_AMOUNT AS ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_NET, 0) AS NON_VAT_ITEMS_NET,
                                    COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                    B.VAT_ITEMS_NET,

                                    C.PAY_CASH,
                                    C.PAY_CARD,
                                    C.PAY_OTHERS,

                                    A.transaction_total_amt AS NET_AMOUNT,
                                    A.receipt_type,
                                    A.status,
                                    A.detax_flag,
                                    A.discount_reason_name,
                                    A.doc_no,
                                    A.invc_post_date,
                                    A.bt_cuid,
                                    A.bt_first_name,
                                    A.bt_last_name,
                                    A.workstation_uid,
                                    A.store_sid,
                                    A.employee1_sid,
                                    (COALESCE(A.disc_amt, 0) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)) AS DOC_DISC_AMT,
                                    D.info2,
                                    A.rounding_offset
                                FROM
                                    rpsods.document A
                                LEFT JOIN
                                    (
                                        SELECT
                                            sid,
                                            doc_sid,
                                            SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS GROSS,
                                            SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code = 1) THEN  
                                                    (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS NON_VAT_ITEMS_ORIG_NET,
                                            SUM(
                                                (CASE WHEN (B.tax_code <> 1) THEN  
                                                    (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                            ) AS VAT_ITEMS_NET,

                                            SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                            SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                            SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC
                                        FROM
                                            rpsods.document_item B
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    doc_item_sid,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                FROM
                                                    rpsods.document_item_disc C
                                                GROUP BY
                                                    C.doc_item_sid
                                            ) C ON (C.doc_item_sid = B.sid)
                                        GROUP BY
                                            B.doc_sid
                                    ) B ON A.sid = B.doc_sid
                                LEFT JOIN
                                (
                                    SELECT 
                                        E.doc_sid,
                                        SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                        SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                        SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS
                                    FROM
                                        rpsods.document D
                                    LEFT JOIN 
                                        rpsods.tender E ON (D.sid = E.doc_sid)
                                    GROUP BY
                                        E.doc_sid
                                ) C ON (A.sid = C.doc_sid)
                                LEFT JOIN rpsods.CUSTOMER D ON (D.sid = A.bt_cuid)
                            ) A
                        ) A
                WHERE
                    (A.status = 4
                    OR A.status = 3)
                    AND A.detax_flag = 1
                    AND A.SC_DISC = 0 
                    AND A.PWD_DISC = 0
                    AND A.SP_DISC = 0
                    AND A.doc_no IS NOT NULL";

            if ($this->workstation != 'all' AND $this->workstation != '') {
                $sql .= ' AND A.workstation_uid = ' . $this->workstation;
            }

            if ($this->store != 'all' AND $this->store != '') {
                $sql .= ' AND A.store_sid = ' . $this->store;
            }

            if ($this->cashier != 'all' AND $this->cashier != '') {
                $sql .= ' AND A.employee1_sid = ' . $this->cashier;
            }

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND DATE_FORMAT(A.invc_post_date, \'%Y-%m-%d\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            if ($isReadOnly) {
                $sql .= ' ORDER BY A.doc_no ASC';
            } else {
                $sql .= ' ORDER BY A.receipt_type ASC';
            }

            // echo "<pre>$sql";

            return $sql;
        }
    
        public function getXZReading()
        {
            $from = date_format(date_create($this->fromDate), 'Y-m-d H:i:s');
            $to = date_format(date_create($this->toDate), 'Y-m-d H:i') . ':59';
            
            $sql = "
                SELECT
                    
                    (CASE WHEN(A.TOTAL_DOC_COUNT > 0) THEN
                        (((@beg:=@end + A.NET_AMOUNT) - A.NET_AMOUNT) + A.PREV_NET_AMOUNT)
                    ELSE
                        (
                            COALESCE((
                                SELECT 
                                    (CASE WHEN (doc.receipt_type = 2) THEN 0 ELSE
                                        SUM(doc.transaction_total_amt) 
                                    END)
                                FROM 
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3) AND 
                                    doc.invc_post_date < '$from'" . 
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                            "), 0)
                        )
                    END) AS BEGINNING,

                    (CASE WHEN(A.TOTAL_DOC_COUNT > 0) THEN
                        ((@end:=@end + A.NET_AMOUNT) + A.PREV_NET_AMOUNT) 
                    ELSE
                        (
                            COALESCE((
                                SELECT 
                                    (CASE WHEN (doc.receipt_type = 2) THEN 0 ELSE
                                        SUM(doc.transaction_total_amt) 
                                    END)
                                FROM 
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    ((doc.status = 4 OR doc.status = 3) OR doc.status = 3) AND 
                                    doc.invc_post_date < '$from'" .
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                            "), 0)
                        )
                    END) AS ENDING,

                    A.*,
                    A.NET_AMOUNT AS TOTAL_INCOME,
                    (A.OTHER_INCOME + A.TOTAL_FEES) AS OTHER_INCOME,
                    A.GROSS AS GROSS_INCOME,
                    A.VAT_AMOUNT AS VAT_PAYABLE,
                    (A.VAT_SALES + A.VAT_EXEMPT + A.ZERO_RATED) AS TOTAL_SALES,
                    A.TOTAL_FEES AS FEES,
                    -- (@minzcount:=@zcount) AS MIN_ZCOUNTER,
                            
                    (@prevdate:=(
                        CASE WHEN (@prevdate = '1970-01-01') THEN
                            DATE_FORMAT(A.invc_post_date, '%Y-%m-%d') ELSE @prevdate END
                        ))
                     AS PREV_PREV_DATE,

                     

                    (
                        SELECT
                            SUM(Z.tender_total_open)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS OPEN_AMOUNT,
                    (
                        SELECT
                            SUM(Z.total_sales)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS CASH_SALES,
                    (
                        SELECT
                            SUM(A.currency_total)
                        FROM
                            zout_control Z
                        LEFT JOIN drawer_event AS A
                        ON Z.open_drawer_event_sid = A.reference_event
                        WHERE
                            (A.event_type = 5) AND
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS DISB_PAID_IN,
                    (
                       SELECT
                            SUM(A.currency_total) * -1
                        FROM
                            zout_control Z
                        LEFT JOIN drawer_event AS A
                        ON Z.open_drawer_event_sid = A.reference_event
                        WHERE
                            A.event_type = 6 AND
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS DISB_PAID_OUT,
                    (
                        SELECT
                            SUM(A.currency_total)
                        FROM
                            zout_control Z
                        LEFT JOIN drawer_event AS A
                        ON Z.open_drawer_event_sid = A.reference_event
                        WHERE
                            A.event_type = 3 AND
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS CASH_DROP_LESS,
                    (
                        SELECT
                            SUM(Z.drawer_leave_amount)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS TOTAL_IN_DRAWER,
                    (
                        SELECT
                            SUM(Z.tender_total_close)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS CASH_COUNT_DECLARATION,
                    (
                        SELECT
                            SUM(Z.over_short_amt)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                    ) AS CASH_OVER_SHORT,
                    (
                        SELECT 
                            GROUP_CONCAT(
                                CONCAT(B.denomination_name, ' - ', A.currency_count) 
                                SEPARATOR ' | '
                            )
                        FROM 
                            drawer_event_currency as A
                        LEFT JOIN 
                            zout_control Z ON A.drawer_event_sid = Z.close_drawer_event_sid
                        LEFT JOIN 
                            currency_denomination B ON A.denomination_sid = B.sid
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            Z.period_begin BETWEEN '$from' AND '$to'
                        ORDER BY B.denomination_name desc 
                    ) AS CASH_COUNT_DENOMINATION,




                    (
                        SELECT
                            COUNT(*)
                        FROM
                            zout_control Z
                        WHERE
                            Z.status = 3 AND
                            (Z.report_type = 2 OR Z.report_type = 3) AND 
                            DATE_FORMAT(Z.period_begin, '%Y-%m-%d') < DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                    ) AS MIN_ZCOUNTER,

                    (@zcount:=(
                        SELECT
                            COUNT(*)
                        FROM
                            zout_control Z
                        WHERE
                            DATE_FORMAT(Z.period_begin, '%Y-%m-%d %H:%i') <= DATE_FORMAT('$from', '%Y-%m-%d %H:%i')
                    )) AS ZCOUNT,

                    (@prevdate:=DATE_FORMAT(A.invc_post_date, '%Y-%m-%d'))
                FROM
                    (
                        SELECT  
                            COUNT(*) AS TOTAL_DOC_COUNT,
                            A.CREATED_DATE,
                            A.INVOICE_NO,           

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.GROSS)
                            END) AS GROSS,

                            0 AS OTHER_CHARGES,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.SC_DISC
                            END) AS SC_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PWD_DISC
                            END) AS PWD_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.SP_DISC
                            END) AS SP_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.ATHLETE_DISC
                            END) AS ATHLETE_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.OTHER_DISC
                            END) AS OTHER_DISC,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.VAT_ADJUSTMENT
                            END) AS VAT_ADJUSTMENT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.NET_AMOUNT 
                            END) AS NET_AMOUNT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag <> 1) THEN
                                    (((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12)
                                ELSE 0 END)
                            END) AS VAT_SALES,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag <> 1) THEN
                                    ((((A.NET_AMOUNT - A.NON_VAT_ITEMS_NET)) / 1.12) * 0.12)
                                ELSE 0 END)
                            END) AS VAT_AMOUNT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.detax_flag = 1 AND (A.SC_DISC <> 0 OR A.PWD_DISC <> 0 OR A.SP_DISC <> 0)) THEN
                                    A.GROSS
                                ELSE 
                                    (A.NON_VAT_ITEMS_ORIG_NET)
                                END)
                            END) AS VAT_EXEMPT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (CASE WHEN (A.SC_DISC = 0 AND A.PWD_DISC = 0 AND A.SP_DISC = 0 AND A.detax_flag = 1) THEN
                                    A.NET_AMOUNT
                                ELSE 0 END)
                            END) AS ZERO_RATED,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_CASH
                            END) AS PAY_CASH,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_CARD
                            END) AS PAY_CARD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.PAY_OTHERS
                            END) AS PAY_OTHERS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.CASH_PAYMENTS
                            END) AS CASH_PAYMENTS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.NON_CASH_PAYMENTS
                            END) AS NON_CASH_PAYMENTS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CREDIT_CARD
                            END) AS TENDER_CREDIT_CARD,
                            
                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CHECK
                            END) AS TENDER_CHECK,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_COD
                            END) AS TENDER_COD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CHARGE
                            END) AS TENDER_CHARGE,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_STORE_CREDIT
                            END) AS TENDER_STORE_CREDIT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_DEPOSIT
                            END) AS TENDER_DEPOSIT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_PAYMENTS
                            END) AS TENDER_PAYMENTS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_GIFT_CERTIFICATE
                            END) AS TENDER_GIFT_CERTIFICATE,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_GIFT_CARD
                            END) AS TENDER_GIFT_CARD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_DEBIT_CARD
                            END) AS TENDER_DEBIT_CARD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_TRAVELERS_CHECK
                            END) AS TENDER_TRAVELERS_CHECK,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CENTRAL_GIFT_CARD
                            END) AS TENDER_CENTRAL_GIFT_CARD,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CENTRAL_GIFT_CERTIFICATE
                            END) AS TENDER_CENTRAL_GIFT_CERTIFICATE,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CENTRAL_CREDIT
                            END) AS TENDER_CENTRAL_CREDIT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.TENDER_CUSTOMER_LOYALTY
                            END) AS TENDER_CUSTOMER_LOYALTY,

                            GROUP_CONCAT(A.NON_CASH_PAYMENTS_BREAKDOWN) AS NON_CASH_PAYMENTS_BREAKDOWN,
                            GROUP_CONCAT(A.NON_CASH_PAYMENT_NAMES_BREAKDOWN) AS NON_CASH_PAYMENT_NAMES_BREAKDOWN,
                            
                            GROUP_CONCAT(A.TENDER_CREDIT_CARDS SEPARATOR '|') AS TENDER_CREDIT_CARDS,

                            (CASE WHEN A.receipt_type = 1 THEN '' ELSE 
                                CASE WHEN A.receipt_type = 2 THEN '' ELSE '' END 
                            END) AS REMARKS,

                            COALESCE((
                                SELECT 
                                    SUM(CASE WHEN (doc.receipt_type = 2) THEN 0 ELSE
                                        (doc.transaction_total_amt) 
                                    END)
                                FROM 
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3) AND 
                                    doc.invc_post_date < '$from'" .
                                    (($this->workstation != 'all' AND $this->workstation != '') ? ' AND doc.workstation_uid = ' . $this->workstation : '') . 
                                    (($this->cashier != 'all' AND $this->cashier != '') ? ' AND doc.employee1_sid = ' . $this->cashier : '') .
                            "), 0) AS PREV_NET_AMOUNT,

                            (
                                SELECT 
                                    LPAD(MIN(doc.DOC_NO), 7, '0')
                                FROM
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3)
                                    AND (doc.DOC_NO IS NOT NULL)
                                    AND (receipt_type = 0 OR receipt_type = 2)
                                    AND DATE_FORMAT(doc.invc_post_date, '%Y-%m-%d') = DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                                LIMIT 1
                            ) AS MIN_INVOICE_NO,

                            (
                                SELECT 
                                    LPAD(MAX(doc.DOC_NO), 7, '0')
                                FROM
                                    rpsods.DOCUMENT doc
                                WHERE 
                                    (doc.status = 4 OR doc.status = 3)
                                    AND (doc.DOC_NO IS NOT NULL)
                                    AND (receipt_type = 0 OR receipt_type = 2)
                                    AND DATE_FORMAT(doc.invc_post_date, '%Y-%m-%d') = DATE_FORMAT(A.invc_post_date, '%Y-%m-%d')
                                LIMIT 1
                            ) AS MAX_INVOICE_NO,

                            ABS(SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.RETURNS_GROSS)
                            END)) AS RETURNS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.VOIDS)
                            END) AS VOIDS,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                (A.OTHER_INCOME)
                            END) AS OTHER_INCOME,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE
                                A.FEES
                            END) AS TOTAL_FEES,

                            LPAD(MIN(CASE WHEN (A.receipt_type = 0 OR (A.receipt_type = 2 AND A.has_deposit = 1)) THEN A.DOC_NO END), 7, '0') BEGINNING_SI,
                            LPAD(MAX(CASE WHEN (A.receipt_type = 0 OR (A.receipt_type = 2 AND A.has_deposit = 1)) THEN A.DOC_NO END), 7, '0') ENDING_SI,
                            LPAD(MIN(CASE WHEN (A.receipt_type = 1) THEN A.DOC_NO END), 7, '0') BEGINNING_RETURN_SI,
                            LPAD(MAX(CASE WHEN (A.receipt_type = 1) THEN A.DOC_NO END), 7, '0') ENDING_RETURN_SI,

                            SUM(CASE WHEN (A.receipt_type = 0 OR (A.receipt_type = 2 AND A.has_deposit = 1)) THEN 1 ELSE 0 END) AS TOTAL_SI,
                            SUM(CASE WHEN (A.receipt_type = 1) THEN 1 ELSE 0 END) AS TOTAL_RETURN_SI,

                            SUM(A.TRANSACTION_COUNT) AS TRANSACTION_COUNT,

                            SUM(CASE WHEN (A.receipt_type = 2) THEN 0 ELSE 
                                A.rounding_offset
                            END) AS ROUNDING_OFFSET,

                            A.receipt_type,
                            A.status,
                            A.doc_no,
                            A.invc_post_date,
                            A.workstation_uid,
                            A.employee1_sid,
                            MAX(A.invc_post_date) AS MAX_INVC_POST_DATE
                        FROM
                            (
                                SELECT
                                    A.*,
                                    A.OTHER_DISC_VAT_ADJ AS VAT_ADJUSTMENT
                                FROM
                                    (
                                        SELECT
                                            DATE_FORMAT(A.invc_post_date, '%m-%d-%Y') AS CREATED_DATE,
                                            LPAD(A.doc_no, 7, '0') AS INVOICE_NO,
                                            (COALESCE(A.fee_amt1, 0) + COALESCE(A.fee_amt2, 0) + COALESCE(A.fee_amt3, 0) + COALESCE(A.fee_amt4, 0) + COALESCE(A.fee_amt5, 0) + COALESCE(A.shipping_amt, 0)) AS FEES,
                                            
                                            B.GROSS,
                                            B.ADJUSTED_GROSS,
                                            
                                            (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SC_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_SC_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SC_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SC_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'SC' OR B.TOTAL_ITEM_SC_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SC_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SC_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_PWD_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_PWD_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_PWD_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS PWD_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'PWD' OR B.TOTAL_ITEM_PWD_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_PWD_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS PWD_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_SP_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_SP_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_SP_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SP_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'SP' OR B.TOTAL_ITEM_SP_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_SP_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS SP_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_ATHLETE_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                ELSE 
                                                    ((B.TOTAL_VAT_ITEM_ATHLETE_DISC / 1.12) + B.TOTAL_NON_VAT_ITEM_ATHLETE_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS ATHLETE_DISC,

                                            (CASE WHEN (A.discount_reason_name = 'ATHLETE' OR B.TOTAL_ITEM_ATHLETE_DISC <> 0) THEN 
                                                CASE WHEN (A.detax_flag = 1) THEN
                                                    0
                                                ELSE 
                                                    (((COALESCE(A.disc_amt, 0) + B.TOTAL_VAT_ITEM_ATHLETE_DISC) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                END
                                            ELSE 0 END) AS ATHLETE_DISC_VAT_ADJ,

                                            (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0 AND B.TOTAL_VAT_ITEM_ATHLETE_DISC = 0 AND B.TOTAL_ITEM_SP_DISC = 0) THEN
                                                    CASE WHEN (A.detax_flag = 1) THEN
                                                        ((COALESCE(A.disc_amt, 0) + B.TOTAL_ITEM_OTHER_DISC) / 1.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    ELSE 
                                                        (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) + B.TOTAL_NON_VAT_ITEM_OTHER_DISC) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    END
                                            ELSE 0 END) AS OTHER_DISC,

                                            (CASE WHEN (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' AND A.discount_reason_name <> 'SP' AND A.discount_reason_name <> 'ATHLETE' AND B.TOTAL_ITEM_SC_DISC = 0 AND B.TOTAL_ITEM_PWD_DISC = 0) THEN
                                                    CASE WHEN (A.detax_flag = 1) THEN
                                                        0
                                                    ELSE 
                                                        (((COALESCE(A.disc_amt, 0) + (B.TOTAL_VAT_ITEM_OTHER_DISC)) / 1.12) * 0.12) * (CASE WHEN A.receipt_type = 1 THEN -1 ELSE 1 END)
                                                    END
                                            ELSE 0 END) AS OTHER_DISC_VAT_ADJ,

                                            (CASE WHEN (A.receipt_type = 0) THEN 1 ELSE 0 END) AS TRANSACTION_COUNT,

                                            B.NET_AMOUNT AS ITEMS_NET,
                                            B.NON_VAT_ITEMS_NET,
                                            COALESCE(B.NON_VAT_ITEMS_ORIG_NET, 0) AS NON_VAT_ITEMS_ORIG_NET,
                                            B.VAT_ITEMS_NET,

                                            A.transaction_total_amt AS NET_AMOUNT,

                                            C.PAY_CASH,
                                            C.PAY_CARD,
                                            C.PAY_OTHERS,
                                            C.OTHER_INCOME,
                                            C.CASH_PAYMENTS,
                                            C.NON_CASH_PAYMENTS,
                                            C.TENDER_CHECK,
                                            C.TENDER_CREDIT_CARD,
                                            C.TENDER_COD,
                                            C.TENDER_CHARGE,
                                            C.TENDER_STORE_CREDIT,
                                            C.TENDER_DEPOSIT,
                                            C.TENDER_PAYMENTS,
                                            C.TENDER_GIFT_CERTIFICATE,
                                            C.TENDER_GIFT_CARD,
                                            C.TENDER_DEBIT_CARD,
                                            C.TENDER_TRAVELERS_CHECK,
                                            C.TENDER_CENTRAL_GIFT_CARD,
                                            C.TENDER_CENTRAL_GIFT_CERTIFICATE,
                                            C.TENDER_CENTRAL_CREDIT,
                                            C.TENDER_CUSTOMER_LOYALTY,
                                            CONCAT(C.NON_CASH_PAYMENTS_BREAKDOWN,':',A.receipt_type) AS NON_CASH_PAYMENTS_BREAKDOWN,
                                            CONCAT(C.NON_CASH_PAYMENT_NAMES_BREAKDOWN,':',A.receipt_type) AS NON_CASH_PAYMENT_NAMES_BREAKDOWN,

                                            B.RETURNS_GROSS,
                                            B.VOIDS,

                                            A.receipt_type,
                                            A.status,
                                            A.detax_flag,
                                            A.discount_reason_name,
                                            A.doc_no,
                                            A.invc_post_date,
                                            A.has_deposit,
                                            A.workstation_uid,
                                            A.employee1_sid,
                                            CONCAT(D.TENDER_CREDIT_CARDS,':',A.receipt_type) AS TENDER_CREDIT_CARDS,
                                            A.rounding_offset
                                        FROM
                                            rpsods.document A
                                        LEFT JOIN
                                            (
                                                SELECT
                                                    sid,
                                                    doc_sid,
                                                    SUM((CASE WHEN (B.item_type <> 2) THEN (B.orig_price * B.qty) ELSE 0 END)) AS GROSS,
                                                    SUM(B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS ADJUSTED_GROSS,                        
                                                    SUM(B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) AS NET_AMOUNT,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code = 1) THEN  
                                                            (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS NON_VAT_ITEMS_NET,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code = 1) THEN  
                                                            (B.orig_price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS NON_VAT_ITEMS_ORIG_NET,
                                                    SUM(
                                                        (CASE WHEN (B.tax_code <> 1) THEN  
                                                            (B.price * B.qty) * (CASE WHEN B.item_type = 2 THEN -1 ELSE 1 END) ELSE 0 END)
                                                    ) AS VAT_ITEMS_NET,

                                                    SUM(COALESCE(C.TOTAL_ITEM_SC_DISC, 0) * B.qty) AS TOTAL_ITEM_SC_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_PWD_DISC, 0 ) * B.qty) AS TOTAL_ITEM_PWD_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_SP_DISC, 0 ) * B.qty) AS TOTAL_ITEM_SP_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0 ) * B.qty) AS TOTAL_ITEM_ATHLETE_DISC,
                                                    SUM(COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0 ) * B.qty) AS TOTAL_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SC_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_PWD_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_SP_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_ATHLETE_DISC,
                                                    SUM((CASE WHEN (B.tax_code = 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_NON_VAT_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SC_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SC_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_PWD_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_PWD_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_SP_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_SP_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_ATHLETE_DISC, 0) ELSE 0 END) * B.qty) AS TOTAL_VAT_ITEM_ATHLETE_DISC,
                                                    SUM((CASE WHEN (B.tax_code <> 1) THEN  COALESCE(C.TOTAL_ITEM_OTHER_DISC, 0) ELSE 0 END)* B.qty)  AS TOTAL_VAT_ITEM_OTHER_DISC,

                                                    SUM((CASE WHEN (B.item_type = 2) THEN (B.orig_price * B.qty) ELSE 0 END) * -1) AS RETURNS_GROSS,

                                                    SUM(CASE WHEN (B.item_type = 5) THEN (B.price * B.qty) ELSE 0 END) AS VOIDS
                                                FROM
                                                    rpsods.document_item B
                                                LEFT JOIN
                                                    (
                                                        SELECT
                                                            doc_item_sid,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'SC') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SC_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_PWD_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'SP') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_SP_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason = 'ATHLETE') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_ATHLETE_DISC,
                                                            COALESCE(SUM(CASE WHEN (C.disc_reason <> 'SC' AND C.disc_reason <> 'PWD') THEN COALESCE(C.new_disc_amt, 0) ELSE 0 END), 0) AS TOTAL_ITEM_OTHER_DISC
                                                        FROM
                                                            rpsods.document_item_disc C
                                                        GROUP BY
                                                            C.doc_item_sid
                                                    ) C ON (C.doc_item_sid = B.sid)
                                                GROUP BY
                                                    B.doc_sid
                                            ) B ON A.sid = B.doc_sid
                                        LEFT JOIN
                                            (
                                                SELECT 
                                                    E.doc_sid,
                                                    SUM(CASE WHEN E.tender_type = 0 THEN E.amount ELSE 0 END) AS PAY_CASH,
                                                    SUM(CASE WHEN E.tender_type = 2 THEN E.amount ELSE 0 END) AS PAY_CARD,
                                                    SUM(CASE WHEN (E.tender_type = 0 OR E.tender_type = 2) THEN 0 ELSE E.amount END) AS PAY_OTHERS,
                                                    0 AS OTHER_INCOME,
                                                    SUM(CASE WHEN (E.tender_type = '0') THEN E.amount ELSE 0 END) AS CASH_PAYMENTS,
                                                    SUM(CASE WHEN (E.tender_type <> '0') THEN E.amount ELSE 0 END) AS NON_CASH_PAYMENTS,
                                                    SUM(CASE WHEN (E.tender_type = '1') THEN E.amount ELSE 0 END) AS TENDER_CHECK,
                                                    SUM(CASE WHEN (E.tender_type = '2') THEN E.amount ELSE 0 END) AS TENDER_CREDIT_CARD,
                                                    SUM(CASE WHEN (E.tender_type = '3') THEN E.amount ELSE 0 END) AS TENDER_COD,
                                                    SUM(CASE WHEN (E.tender_type = '4') THEN E.amount ELSE 0 END) AS TENDER_CHARGE,
                                                    SUM(CASE WHEN (E.tender_type = '5') THEN E.amount ELSE 0 END) AS TENDER_STORE_CREDIT,
                                                    SUM(CASE WHEN (E.tender_type = '7') THEN E.amount ELSE 0 END) AS TENDER_DEPOSIT,
                                                    SUM(CASE WHEN (E.tender_type = '8') THEN E.amount ELSE 0 END) AS TENDER_PAYMENTS,
                                                    SUM(CASE WHEN (E.tender_type = '9') THEN E.amount ELSE 0 END) AS TENDER_GIFT_CERTIFICATE,
                                                    SUM(CASE WHEN (E.tender_type = '10') THEN E.amount ELSE 0 END) AS TENDER_GIFT_CARD,
                                                    SUM(CASE WHEN (E.tender_type = '11') THEN E.amount ELSE 0 END) AS TENDER_DEBIT_CARD,
                                                    SUM(CASE WHEN (E.tender_type = '13') THEN E.amount ELSE 0 END) AS TENDER_TRAVELERS_CHECK,
                                                    SUM(CASE WHEN (E.tender_type = '15') THEN E.amount ELSE 0 END) AS TENDER_CENTRAL_GIFT_CARD,
                                                    SUM(CASE WHEN (E.tender_type = '16') THEN E.amount ELSE 0 END) AS TENDER_CENTRAL_GIFT_CERTIFICATE,
                                                    SUM(CASE WHEN (E.tender_type = '17') THEN E.amount ELSE 0 END) AS TENDER_CENTRAL_CREDIT,
                                                    SUM(CASE WHEN (E.tender_type = '18') THEN E.amount ELSE 0 END) AS TENDER_CUSTOMER_LOYALTY,
                                                    (
                                                        GROUP_CONCAT(
                                                            CASE WHEN (E.tender_type <> '0' AND E.tender_type <> '2') THEN CONCAT(E.tender_type, '=', E.amount) END
                                                        SEPARATOR '...')
                                                    ) AS NON_CASH_PAYMENTS_BREAKDOWN,
                                                    (
                                                        GROUP_CONCAT(
                                                            CASE WHEN (E.tender_type <> '0' AND E.tender_type <> '2') THEN CONCAT(E.tender_name, '=', E.amount) END
                                                        SEPARATOR '...')
                                                    ) AS NON_CASH_PAYMENT_NAMES_BREAKDOWN
                                                FROM
                                                    rpsods.tender E
                                                GROUP BY
                                                    E.doc_sid
                                            ) C ON (A.sid = C.doc_sid)
                                        LEFT JOIN
                                            (
                                                SELECT 
                                                    F.doc_sid,
                                                    (CASE WHEN (G.card_type_name IS NULL) THEN
                                                        GROUP_CONCAT(CONCAT('Others', '=', F.amount)) ELSE
                                                        GROUP_CONCAT(CONCAT(G.card_type_name, '=', F.amount)) END
                                                    ) AS TENDER_CREDIT_CARDS
                                                FROM
                                                    rpsods.tender F
                                                LEFT JOIN
                                                    rpsods.tender_credit_card G ON (F.sid = G.tender_sid)
                                                WHERE
                                                    F.tender_type = 2
                                                GROUP BY
                                                    F.doc_sid
                                            ) D ON (A.sid = D.doc_sid)
                                    ) A
                                ) A
                        WHERE
                            (A.status = 4
                            OR A.status = 3)
                            AND A.doc_no IS NOT NULL
                            AND A.invc_post_date BETWEEN '$from' AND '$to'";

                        if ($this->workstation != 'all' AND $this->workstation != '') {
                            $sql .= ' AND A.workstation_uid = ' . $this->workstation;
                        }

                        if ($this->cashier != 'all' AND $this->cashier != '') {
                            $sql .= ' AND A.employee1_sid = ' . $this->cashier;
                        }

            $sql .= ") A
            ";

                // echo "<pre>$sql";

            return $sql;
        }

    }

?>
 