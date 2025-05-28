<?php
header('Content-Type: application/json');

$host = "localhost";
$username = "root";
$password = "sysadmin";
$dbname = "rpsods";

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

$docSid = $_GET['doc_sid'];  // Get the doc_sid from the request

// SQL query
$sql = "SELECT
            d.sid AS SI,
            di.alu AS UPC,
            d.invc_post_date AS Transaction_Date,
            d.store_code AS Store_Code,
            di.qty AS Quantity,
            di.price AS Price,
            di.disc_amt AS Discount,
            di.note2,
            di.note4,
            di.note5,
            d.status,
            t.post_date AS Tender_Date
        FROM document_item di
        LEFT JOIN document d ON d.sid = di.doc_sid
        LEFT JOIN tender t ON t.sid = di.doc_sid
        WHERE d.sid = '$docSid'";

$result = $conn->query($sql);

$data = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

echo json_encode($data);

$conn->close();
?>
