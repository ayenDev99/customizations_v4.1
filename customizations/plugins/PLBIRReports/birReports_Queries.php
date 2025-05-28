<?php
    class BIRReport_Queries {

        private $fromDate;
        private $toDate;

        function __construct(
                $fromDate = null, 
                $toDate = null
            )
        {
            $this->fromDate = $fromDate;
            $this->toDate = $toDate;
        }

        public function getDailySummaryQuery($isReadOnly)
        {
            $sql = "
                SELECT 
                    A.SID,
                    A.created_datetime,
                    LPAD(A.DOC_NO, 7, '0') AS invoice_no,
                    A.receipt_type,
                    A.status,
                    DECODE (A.fee_type1, 1, 0, 0) other_charges,
                    A.transaction_total_amt AS net_amount,
                    TO_CHAR(A.created_datetime, 'MM/DD/YYYY') created_date,
                    DECODE (A.receipt_type, 1, 'RETURN', '') AS remarks,
                    B.*,
                    C.*,
                    ------ CHANGES ------
                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) 
                    ELSE
                        0
                    END) AS vat_sales,

                    (NVL(B.sc_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'SC' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) sc_disc,

                    (NVL(B.pwd_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) pwd_disc,

                    (NVL(B.other_disc, 0) +
                        (CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) other_disc,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                    ELSE
                        0
                    END) AS vat_adjustment,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) * 0.12
                    ELSE
                        0
                    END) AS vat_amount,

                    (CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                        B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                            NVL(((A.disc_amt/1.12)), 0)  ELSE
                            NVL((A.disc_amt), 0) 
                        END)
                    ELSE
                        B.vat_exempt
                    END) + (CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS vat_exempt,

                    (CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS zero_rated
                FROM 
                    RPS.DOCUMENT A
                LEFT JOIN 
                    (
                        SELECT 
                            B.DOC_SID,
                            SUM(B.ORIG_PRICE * B.QTY) as gross,
                            SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN NVL(C.NEW_DISC_AMT, 0) * B.QTY  ELSE 0 END)) sc_disc,
                            SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN NVL(C.NEW_DISC_AMT, 0) * B.QTY ELSE 0 END)) pwd_disc,
                            SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                    CASE WHEN B.DETAX_FLAG = 0 THEN
                                        (NVL(C.NEW_DISC_AMT, 0) * B.QTY) / 1.12
                                    ELSE
                                        NVL(C.NEW_DISC_AMT, 0) * B.QTY
                                    END
                                ELSE 0 END
                            ) other_disc,
                            SUM(
                                CASE WHEN (B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD')) THEN 
                                    (((NVL(C.NEW_DISC_AMT, 0) * B.QTY) / 1.12) * 0.12) 
                                ELSE 0 END
                            ) vat_adjustment,
                            SUM(
                                CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN 
                                    CASE WHEN B.TAX_CODE = 0 THEN
                                        (NVL(B.PRICE, 0) * B.QTY)  ELSE
                                        (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                ELSE 0 END
                            ) vat_exempt,
                            SUM(
                                CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN 
                                    CASE WHEN B.TAX_CODE = 0 THEN
                                        (NVL(B.PRICE, 0) * B.QTY) ELSE
                                        (NVL(B.ORIG_PRICE, 0) * B.QTY) END 
                                ELSE 0 END
                            ) zero_rated
                        FROM 
                              RPS.DOCUMENT_ITEM_DISC C
                        FULL JOIN
                            RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                        GROUP BY B.DOC_SID
                    ) B ON A.SID = B.DOC_SID
                LEFT JOIN
                    (
                    SELECT 
                        E.DOC_SID,
                        SUM(DECODE(E.TENDER_TYPE, 0, E.AMOUNT,0)) AS pay_cash,
                        SUM(DECODE(E.TENDER_TYPE, 2, E.AMOUNT,0)) AS pay_card,
                        SUM(DECODE(E.TENDER_TYPE, 0, 0, DECODE(E.TENDER_TYPE, 2, 0, E.AMOUNT))) AS pay_others
                    FROM
                        RPS.DOCUMENT D
                    LEFT JOIN 
                        RPS.TENDER E ON (D.SID = E.DOC_SID)
                    GROUP BY
                        E.DOC_SID
                    ) C ON (A.SID = C.DOC_SID) 
                WHERE 
                    A.status = 4";

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
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

            $sql = "SELECT
                        A.*,
                        (SUM(A.net_amount) OVER (PARTITION BY A.THISNAME ORDER BY A.created_date) - A.net_amount) + prev_net_amt AS BEGINNING,
                        (SUM(A.net_amount) OVER (PARTITION BY A.THISNAME ORDER BY A.created_date)) + prev_net_amt AS ENDING,
                        SUM(A.zcount) OVER (PARTITION BY A.THISNAME ORDER BY A.created_date) AS zcounter
                    FROM
                    (
                      SELECT 
                        'A' THISNAME,
                        TO_CHAR(A.created_datetime, 'YYYY-MM-DD') AS created_date,
                        LPAD(MIN(A.DOC_NO), 7, '0') AS min_invoice_no,
                        LPAD(MAX(A.DOC_NO), 7, '0') AS max_invoice_no,
                        NVL(SUM(A.transaction_total_amt), 0) AS net_amount,
                        (
                            (SELECT NVL(SUM(docss.transaction_total_amt), 0) FROM RPS.DOCUMENT docss
                                WHERE 
                                    docss.status = 4 AND 
                                    TO_CHAR(docss.created_datetime, 'YYYY-MM-DD') < '$from'
                            )
                        ) AS prev_net_amt,

                        (SUM(NVL(B.sc_disc, 0)) + 
                            SUM(CASE WHEN A.discount_reason_name = 'SC' THEN
                               CASE WHEN A.DETAX_FLAG = 0 THEN
                                    NVL(A.disc_amt, 0) / 1.12 ELSE
                                    NVL(A.disc_amt, 0) END
                            ELSE 0 END)
                        ) sc_disc,

                        (SUM(NVL(B.pwd_disc, 0)) + 
                            SUM(CASE WHEN A.discount_reason_name = 'PWD' THEN
                               CASE WHEN A.DETAX_FLAG = 0 THEN
                                    NVL(A.disc_amt, 0) / 1.12 ELSE
                                    NVL(A.disc_amt, 0) END
                            ELSE 0 END)
                        ) pwd_disc,

                        (SUM(NVL(B.other_disc, 0)) + 
                            SUM(CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                               CASE WHEN A.DETAX_FLAG = 0 THEN
                                    NVL(A.disc_amt, 0) / 1.12 ELSE
                                    NVL(A.disc_amt, 0) END
                            ELSE 0 END)
                        ) other_disc,
                        
                        NVL(SUM(DECODE (A.receipt_type, 1, ABS(A.transaction_total_amt), 0)), 0) AS returns,
                        NVL(SUM(B.voids), 0) AS voids,
                        SUM(CASE WHEN A.DETAX_FLAG = 0 THEN
                            B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                        ELSE
                            0
                        END) AS vat_adjustment,
                        NVL((
                            SUM(A.transaction_total_amt) +
                            SUM(B.sc_disc) + 
                            SUM(B.pwd_disc) +
                            SUM(CASE WHEN A.DETAX_FLAG = 0 THEN B.other_disc + NVL(((A.disc_amt/1.12)), 0) ELSE B.other_disc + NVL((A.disc_amt), 0) END) +
                            SUM(DECODE (A.receipt_type, 1, ABS(A.transaction_total_amt), 0)) +
                            SUM(B.voids) +
                            SUM(CASE WHEN A.DETAX_FLAG = 0 THEN B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12) ELSE 0 END)
                        ), 0) AS total_income,
                        NVL(SUM(C.other_income), 0) AS other_income,
                        NVL(SUM(B.gross), 0) AS gross_income,
                        SUM(CASE WHEN A.DETAX_FLAG = 0 THEN
                            (A.transaction_total_amt / 1.12) 
                        ELSE
                            0
                        END) AS vat_sales,
                        SUM(CASE WHEN A.DETAX_FLAG = 0 THEN
                            (A.transaction_total_amt / 1.12) * 0.12
                        ELSE
                            0
                        END) AS vat_amount,

                        SUM(CASE WHEN A.DETAX_FLAG = 0 THEN (A.transaction_total_amt / 1.12) * 0.12 ELSE 0 END) AS vat_payable,
                        NVL((
                            SUM(CASE WHEN A.DETAX_FLAG = 0 THEN (A.transaction_total_amt / 1.12) ELSE 0 END) +
                            SUM(B.vat_exempt) +
                            SUM(B.zero_rated)
                        ), 0) AS total_sales,
                        (CASE WHEN COUNT(C.SID) > 0 THEN 1 ELSE 0 END) zcount,

                        (SUM(CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                            B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0) 
                            END)
                        ELSE
                            B.vat_exempt
                        END) + SUM(CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                            CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                                B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                    NVL(((A.disc_amt/1.12)), 0)  ELSE
                                    NVL((A.disc_amt), 0)
                                END)
                            ELSE
                                B.zero_rated
                            END
                        ELSE 0 END)) AS vat_exempt,

                        SUM(CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                            CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                                B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                    NVL(((A.disc_amt/1.12)), 0)  ELSE
                                    NVL((A.disc_amt), 0)
                                END)
                            ELSE B.zero_rated END
                        ELSE 0 END) AS zero_rated
                    FROM 
                        RPS.DOCUMENT A
                    LEFT JOIN 
                        (
                            SELECT 
                                B.DOC_SID,
                                SUM(CASE WHEN B.ITEM_TYPE = 2 THEN (B.ORIG_PRICE * B.QTY) * -1 ELSE (B.ORIG_PRICE * B.QTY) END) as gross,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1)  * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) sc_disc,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1) * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) pwd_disc,
                                SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                        CASE WHEN B.DETAX_FLAG = 0 THEN
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12 * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12) * B.QTY END
                                        ELSE
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0)) * B.QTY END
                                        END
                                    ELSE 0 END
                                ) other_disc,
                                SUM((CASE WHEN B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD') THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) * -1 ELSE
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) END
                                    ELSE 0 END)) vat_adjustment,
                                SUM(
                                    CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) vat_exempt,
                                SUM(
                                    CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) zero_rated,
                                SUM(CASE WHEN B.ITEM_TYPE = 5 THEN B.PRICE ELSE 0 END) voids
                            FROM 
                                  RPS.DOCUMENT_ITEM_DISC C
                            FULL JOIN
                                RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                            GROUP BY B.DOC_SID
                        ) B ON A.SID = B.DOC_SID
                      LEFT JOIN
                        (
                        SELECT 
                            E.DOC_SID,
                            SUM(DECODE(E.tender_name, 'Gift Card', E.amount, 0)) AS other_income
                        FROM
                            RPS.DOCUMENT D
                        LEFT JOIN 
                            RPS.TENDER E ON (D.SID = E.DOC_SID)
                        GROUP BY
                            E.DOC_SID
                        ) C ON (A.SID = C.DOC_SID)
                        LEFT JOIN
                            RPS.SUBSIDIARY B ON (A.SBS_NO = B.SBS_NO)
                        LEFT JOIN
                            RPS.ZOUT_CONTROL C ON (TO_CHAR(A.created_datetime, 'YYYY-MM-DD') = TO_CHAR(C.POST_DATE, 'YYYY-MM-DD')
                                AND B.SID = C.SBS_SID) 
                        WHERE 
                            A.status = 4";
                    
                        if ($this->fromDate && $this->toDate) {
                            $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
                        }

            $sql .= "
                    GROUP BY
                        TO_CHAR(A.created_datetime, 'YYYY-MM-DD')
                    ORDER BY 
                        TO_CHAR(A.created_datetime, 'YYYY-MM-DD')
                ) A";
// echo "<pre>$sql";
            return $sql;
        }      

        public function getReturnReportQuery($isReadOnly)
        {
            $sql = "
                SELECT 
                    A.SID,
                    A.created_datetime,
                    LPAD(A.DOC_NO, 7, '0') AS invoice_no,
                    A.receipt_type,
                    A.status,
                    DECODE (A.fee_type1, 1, 0, 0) other_charges,
                    A.transaction_total_amt AS net_amount,
                    TO_CHAR(A.created_datetime, 'MM/DD/YYYY') created_date,
                    DECODE (A.receipt_type, 1, 'RETURN', '') AS remarks,
                    B.*,
                    C.*,
                    ------ CHANGES ------
                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) 
                    ELSE
                        0
                    END) AS vat_sales,

                    (NVL(B.sc_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'SC' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) sc_disc,

                    (NVL(B.pwd_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) pwd_disc,

                    (NVL(B.other_disc, 0) +
                        (CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) * -1 other_disc,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                    ELSE
                        0
                    END) * -1 AS vat_adjustment,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) * 0.12
                    ELSE
                        0
                    END) AS vat_amount,

                    (CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                        B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                            NVL(((A.disc_amt/1.12)), 0)  ELSE
                            NVL((A.disc_amt), 0) 
                        END)
                    ELSE
                        B.vat_exempt
                    END) + (CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS vat_exempt,

                    (CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS zero_rated
                FROM 
                    RPS.DOCUMENT A
                LEFT JOIN 
                    (
                        SELECT 
                            B.DOC_SID,
                            SUM(B.ORIG_PRICE * B.QTY) * -1 as gross,
                            SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN NVL(C.NEW_DISC_AMT, 0) * B.QTY  ELSE 0 END)) * -1 sc_disc,
                            SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN NVL(C.NEW_DISC_AMT, 0) * B.QTY ELSE 0 END)) * -1 pwd_disc,
                            SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                    CASE WHEN B.DETAX_FLAG = 0 THEN
                                        (NVL(C.NEW_DISC_AMT, 0) * B.QTY) / 1.12
                                    ELSE
                                        NVL(C.NEW_DISC_AMT, 0) * B.QTY
                                    END
                                ELSE 0 END
                            ) other_disc,
                            SUM(
                                CASE WHEN (B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD')) THEN 
                                    (((NVL(C.NEW_DISC_AMT, 0) * B.QTY) / 1.12) * 0.12) 
                                ELSE 0 END
                            ) vat_adjustment,
                            SUM(
                                CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN 
                                    CASE WHEN B.TAX_CODE = 0 THEN
                                        (NVL(B.PRICE, 0) * B.QTY)  ELSE
                                        (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                ELSE 0 END
                            ) * -1 vat_exempt,
                            SUM(
                                CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN 
                                    CASE WHEN B.TAX_CODE = 0 THEN
                                        (NVL(B.PRICE, 0) * B.QTY) ELSE
                                        (NVL(B.ORIG_PRICE, 0) * B.QTY) END 
                                ELSE 0 END
                            ) * -1 zero_rated
                        FROM 
                              RPS.DOCUMENT_ITEM_DISC C
                        FULL JOIN
                            RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                        GROUP BY B.DOC_SID
                    ) B ON A.SID = B.DOC_SID
                LEFT JOIN
                    (
                    SELECT 
                        E.DOC_SID,
                        SUM(DECODE(E.TENDER_TYPE, 0, E.AMOUNT,0)) AS pay_cash,
                        SUM(DECODE(E.TENDER_TYPE, 2, E.AMOUNT,0)) AS pay_card,
                        SUM(DECODE(E.TENDER_TYPE, 0, 0, DECODE(E.TENDER_TYPE, 2, 0, E.AMOUNT))) AS pay_others
                    FROM
                        RPS.DOCUMENT D
                    LEFT JOIN 
                        RPS.TENDER E ON (D.SID = E.DOC_SID)
                    GROUP BY
                        E.DOC_SID
                    ) C ON (A.SID = C.DOC_SID) 
                WHERE 
                    A.status = 4
                    AND A.receipt_type = 1";

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            $sql .= ' ORDER BY A.doc_no ASC';

            return $sql;
        }

        public function getSeniorCitizenQuery($isReadOnly)
        {
            $sql = "
                SELECT 
                    A.SID,
                    A.created_datetime,
                    LPAD(A.DOC_NO, 7, '0') AS invoice_no,
                    A.receipt_type,
                    A.status,
                    DECODE (A.fee_type1, 1, 0, 0) other_charges,
                    A.transaction_total_amt AS net_amount,
                    TO_CHAR(A.created_datetime, 'MM/DD/YYYY') created_date,
                    DECODE (A.receipt_type, 1, 'RETURN', '') AS remarks,
                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS sc_name,
                    D.INFO1 AS sc_no,
                    B.*,
                    C.*,
                    ------ CHANGES ------
                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) 
                    ELSE
                        0
                    END) AS vat_sales,

                    (NVL(B.sc_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'SC' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) sc_disc,

                    (NVL(B.pwd_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) pwd_disc,

                    (NVL(B.other_disc, 0) +
                        (CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) other_disc,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                    ELSE
                        0
                    END) AS vat_adjustment,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) * 0.12
                    ELSE
                        0
                    END) AS vat_amount,

                    (CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                        B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                            NVL(((A.disc_amt/1.12)), 0)  ELSE
                            NVL((A.disc_amt), 0) 
                        END)
                    ELSE
                        B.vat_exempt
                    END) + (CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS vat_exempt,

                    (CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS zero_rated
                FROM 
                    RPS.DOCUMENT A
                LEFT JOIN 
                    (
                        SELECT 
                            B.DOC_SID,
                                SUM(CASE WHEN B.ITEM_TYPE = 2 THEN (B.ORIG_PRICE * B.QTY) * -1 ELSE (B.ORIG_PRICE * B.QTY) END) as gross,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1)  * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) sc_disc,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1) * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) pwd_disc,
                                SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                        CASE WHEN B.DETAX_FLAG = 0 THEN
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12 * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12) * B.QTY END
                                        ELSE
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0)) * B.QTY END
                                        END
                                    ELSE 0 END
                                ) other_disc,
                                SUM((CASE WHEN B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD') THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) * -1 ELSE
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) END
                                    ELSE 0 END)) vat_adjustment,
                                SUM(
                                    CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) vat_exempt,
                                SUM(
                                    CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) zero_rated
                        FROM 
                              RPS.DOCUMENT_ITEM_DISC C
                        FULL JOIN
                            RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                        GROUP BY B.DOC_SID
                    ) B ON A.SID = B.DOC_SID
                LEFT JOIN
                    (
                    SELECT 
                        E.DOC_SID,
                        SUM(DECODE(E.TENDER_TYPE, 0, E.AMOUNT,0)) AS pay_cash,
                        SUM(DECODE(E.TENDER_TYPE, 2, E.AMOUNT,0)) AS pay_card,
                        SUM(DECODE(E.TENDER_TYPE, 0, 0, DECODE(E.TENDER_TYPE, 2, 0, E.AMOUNT))) AS pay_others
                    FROM
                        RPS.DOCUMENT D
                    LEFT JOIN 
                        RPS.TENDER E ON (D.SID = E.DOC_SID)
                    GROUP BY
                        E.DOC_SID
                    ) C ON (A.SID = C.DOC_SID)
                LEFT JOIN RPS.CUSTOMER D ON (D.SID = A.BT_CUID)
                WHERE 
                    A.status = 4
                    AND (B.sc_disc <> 0 OR A.discount_reason_name = 'SC')";

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            $sql .= ' ORDER BY A.doc_no ASC';
            // echo "<pre>$sql";
            return $sql;
        }

        public function getPWDDiscountQuery($isReadOnly)
        {
            $sql = "
                SELECT 
                    A.SID,
                    A.created_datetime,
                    LPAD(A.DOC_NO, 7, '0') AS invoice_no,
                    A.receipt_type,
                    A.status,
                    DECODE (A.fee_type1, 1, 0, 0) other_charges,
                    A.transaction_total_amt AS net_amount,
                    TO_CHAR(A.created_datetime, 'MM/DD/YYYY') created_date,
                    DECODE (A.receipt_type, 1, 'RETURN', '') AS remarks,
                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS pwd_name,
                    D.INFO1 AS pwd_no,
                    B.*,
                    C.*,
                    ------ CHANGES ------
                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) 
                    ELSE
                        0
                    END) AS vat_sales,

                    (NVL(B.sc_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'SC' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) sc_disc,

                    (NVL(B.pwd_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) pwd_disc,

                    (NVL(B.other_disc, 0) +
                        (CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) other_disc,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                    ELSE
                        0
                    END) AS vat_adjustment,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) * 0.12
                    ELSE
                        0
                    END) AS vat_amount,

                    (CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                        B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                            NVL(((A.disc_amt/1.12)), 0)  ELSE
                            NVL((A.disc_amt), 0) 
                        END)
                    ELSE
                        B.vat_exempt
                    END) + (CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS vat_exempt,

                    (CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS zero_rated
                FROM 
                    RPS.DOCUMENT A
                LEFT JOIN 
                    (
                        SELECT 
                            B.DOC_SID,
                                SUM(CASE WHEN B.ITEM_TYPE = 2 THEN (B.ORIG_PRICE * B.QTY) * -1 ELSE (B.ORIG_PRICE * B.QTY) END) as gross,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1)  * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) sc_disc,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1) * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) pwd_disc,
                                SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                        CASE WHEN B.DETAX_FLAG = 0 THEN
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12 * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12) * B.QTY END
                                        ELSE
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0)) * B.QTY END
                                        END
                                    ELSE 0 END
                                ) other_disc,
                                SUM((CASE WHEN B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD') THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) * -1 ELSE
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) END
                                    ELSE 0 END)) vat_adjustment,
                                SUM(
                                    CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) vat_exempt,
                                SUM(
                                    CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) zero_rated
                        FROM 
                              RPS.DOCUMENT_ITEM_DISC C
                        FULL JOIN
                            RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                        GROUP BY B.DOC_SID
                    ) B ON A.SID = B.DOC_SID
                LEFT JOIN
                    (
                    SELECT 
                        E.DOC_SID,
                        SUM(DECODE(E.TENDER_TYPE, 0, E.AMOUNT,0)) AS pay_cash,
                        SUM(DECODE(E.TENDER_TYPE, 2, E.AMOUNT,0)) AS pay_card,
                        SUM(DECODE(E.TENDER_TYPE, 0, 0, DECODE(E.TENDER_TYPE, 2, 0, E.AMOUNT))) AS pay_others
                    FROM
                        RPS.DOCUMENT D
                    LEFT JOIN 
                        RPS.TENDER E ON (D.SID = E.DOC_SID)
                    GROUP BY
                        E.DOC_SID
                    ) C ON (A.SID = C.DOC_SID)
                LEFT JOIN RPS.CUSTOMER D ON (D.SID = A.BT_CUID)
                WHERE 
                    A.status = 4
                    AND (B.pwd_disc <> 0 OR A.discount_reason_name = 'PWD')";

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            $sql .= ' ORDER BY A.doc_no ASC';

            return $sql;
        }

        public function getZeroRatedQuery($isReadOnly)
        {
            $sql = "
                SELECT 
                    A.SID,
                    A.created_datetime,
                    LPAD(A.DOC_NO, 7, '0') AS invoice_no,
                    A.receipt_type,
                    A.status,
                    DECODE (A.fee_type1, 1, 0, 0) other_charges,
                    A.transaction_total_amt AS net_amount,
                    TO_CHAR(A.created_datetime, 'MM/DD/YYYY') created_date,
                    DECODE (A.receipt_type, 1, 'RETURN', '') AS remarks,
                    CONCAT(CONCAT(A.bt_first_name, ' '), A.bt_last_name) AS cust_name,
                    B.*,
                    C.*,
                    ------ CHANGES ------
                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) 
                    ELSE
                        0
                    END) AS vat_sales,

                    (NVL(B.sc_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'SC' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) sc_disc,

                    (NVL(B.pwd_disc, 0) +
                        (CASE WHEN A.discount_reason_name = 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) pwd_disc,

                    (NVL(B.other_disc, 0) +
                        (CASE WHEN A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD' THEN
                            CASE WHEN A.DETAX_FLAG = 0 THEN
                                (NVL(A.disc_amt, 0) / 1.12) ELSE
                                NVL(A.disc_amt, 0) END
                        ELSE 0 END)
                    ) other_disc,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        B.vat_adjustment + (NVL(((A.disc_amt/1.12)), 0) * 0.12)
                    ELSE
                        0
                    END) AS vat_adjustment,

                    (CASE WHEN A.DETAX_FLAG = 0 THEN
                        (A.transaction_total_amt / 1.12) * 0.12
                    ELSE
                        0
                    END) AS vat_amount,

                    (CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated = 0 THEN
                        B.vat_exempt - (CASE WHEN A.DETAX_FLAG = 0 THEN
                            NVL(((A.disc_amt/1.12)), 0)  ELSE
                            NVL((A.disc_amt), 0) 
                        END)
                    ELSE
                        B.vat_exempt
                    END) + (CASE WHEN (B.vat_exempt <> 0) OR (A.discount_reason_name = 'SC' OR A.discount_reason_name = 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS vat_exempt,

                    (CASE WHEN (B.vat_exempt = 0) AND (A.discount_reason_name <> 'SC' AND A.discount_reason_name <> 'PWD') THEN
                        CASE WHEN A.DETAX_FLAG = 1 AND B.zero_rated <> 0 THEN
                            B.zero_rated - (CASE WHEN A.DETAX_FLAG = 0 THEN
                                NVL(((A.disc_amt/1.12)), 0)  ELSE
                                NVL((A.disc_amt), 0)
                            END)
                        ELSE
                            B.zero_rated
                        END
                    ELSE 0 END) AS zero_rated
                FROM 
                    RPS.DOCUMENT A
                LEFT JOIN 
                    (
                        SELECT 
                            B.DOC_SID,
                                SUM(CASE WHEN B.ITEM_TYPE = 2 THEN (B.ORIG_PRICE * B.QTY) * -1 ELSE (B.ORIG_PRICE * B.QTY) END) as gross,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'SC' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1)  * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) sc_disc,
                                SUM((CASE WHEN NVL(C.DISC_REASON, ' ') = 'PWD' THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            (C.NEW_DISC_AMT * -1) * B.QTY ELSE 
                                            (C.NEW_DISC_AMT) * B.QTY END
                                ELSE 0 END)) pwd_disc,
                                SUM(CASE WHEN NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD' THEN 
                                        CASE WHEN B.DETAX_FLAG = 0 THEN
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12 * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0) / 1.12) * B.QTY END
                                        ELSE
                                            CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                                (NVL(C.NEW_DISC_AMT, 0) * -1) * B.QTY ELSE 
                                                (NVL(C.NEW_DISC_AMT, 0)) * B.QTY END
                                        END
                                    ELSE 0 END
                                ) other_disc,
                                SUM((CASE WHEN B.DETAX_FLAG = 0 AND (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD') THEN 
                                        CASE WHEN C.NEW_DISC_AMT > 0 AND B.ITEM_TYPE = 2 THEN 
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) * -1 ELSE
                                            ((NVL(C.NEW_DISC_AMT, 0) * B.QTY / 1.12) * 0.12) END
                                    ELSE 0 END)) vat_adjustment,
                                SUM(
                                    CASE WHEN ((B.DETAX_FLAG = 1 OR B.TAX_CODE = 1) AND (NVL(C.DISC_REASON, ' ') = 'SC' OR NVL(C.DISC_REASON, ' ') = 'PWD')) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) vat_exempt,
                                SUM(
                                    CASE WHEN (B.DETAX_FLAG = 1 AND (NVL(C.DISC_REASON, ' ') IS NULL OR (NVL(C.DISC_REASON, ' ') <> 'SC' AND NVL(C.DISC_REASON, ' ') <> 'PWD'))) THEN
                                        CASE WHEN B.ITEM_TYPE = 2 THEN
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) * -1 ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) * -1 END
                                        ELSE 
                                            CASE WHEN B.TAX_CODE = 0 THEN
                                                (NVL(B.PRICE, 0) * B.QTY) ELSE
                                                (NVL(B.ORIG_PRICE, 0) * B.QTY) END
                                        END
                                    ELSE 0 END
                                ) zero_rated
                        FROM 
                              RPS.DOCUMENT_ITEM_DISC C
                        FULL JOIN
                            RPS.DOCUMENT_ITEM B ON (C.DOC_ITEM_SID = B.SID)
                        GROUP BY B.DOC_SID
                    ) B ON A.SID = B.DOC_SID
                LEFT JOIN
                    (
                    SELECT 
                        E.DOC_SID,
                        SUM(DECODE(E.TENDER_TYPE, 0, E.AMOUNT,0)) AS pay_cash,
                        SUM(DECODE(E.TENDER_TYPE, 2, E.AMOUNT,0)) AS pay_card,
                        SUM(DECODE(E.TENDER_TYPE, 0, 0, DECODE(E.TENDER_TYPE, 2, 0, E.AMOUNT))) AS pay_others
                    FROM
                        RPS.DOCUMENT D
                    LEFT JOIN 
                        RPS.TENDER E ON (D.SID = E.DOC_SID)
                    GROUP BY
                        E.DOC_SID
                    ) C ON (A.SID = C.DOC_SID) 
                WHERE 
                    A.status = 4
                    AND B.zero_rated <> 0
                    AND B.vat_exempt = 0";

            if ($this->fromDate && $this->toDate) {
                $from = date_format(date_create($this->fromDate), 'Y-m-d');
                $to = date_format(date_create($this->toDate), 'Y-m-d');
                $sql .= ' AND TO_CHAR(A.created_datetime, \'YYYY-MM-DD\') BETWEEN \'' . $from .  '\' AND \'' . $to . '\''; 
            }

            $sql .= ' ORDER BY A.doc_no ASC';

            return $sql;
        }
    }
?>
