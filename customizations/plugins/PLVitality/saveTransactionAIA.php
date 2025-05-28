<?php
header("Access-Control-Allow-Origin: *"); // Allow cross-origin requests
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

// Database connection settings
$host = "localhost";
$user = "root";
$password = "sysadmin";
$database = "AIA";
$port = "3306";

// Create database connection
$conn = new mysqli($host, $user, $password, $database, $port);

// Check database connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

// Read JSON input
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

// Debugging: Check if JSON is received
if (!$data) {
    die(json_encode(["error" => "Invalid JSON received", "raw_input" => $inputJSON]));
}

// Get transactions array
$transactions = $data['transactions'];

if (!$transactions || !is_array($transactions)) {
    die(json_encode(["error" => "No transaction data received", "decoded_data" => $data]));
}

// Prepare SQL statement with 27 placeholders
$sql = "INSERT INTO transactions (
    document_sid, document_item_sid, type, numOfUsage, status, currency, 
    fullFareAmount, qualifyingAmount, discountedAmount, additionalFees, cancellationFees, 
    discountAmount, discountPercentage, amountEffectiveDate, lineReference, lineDescription, 
    qualifyingTransaction, partnerSubCode, sku, uniqueProductRef, productCategory, 
    transactionDate, memberfullName, memberIdentifierReference, memberIdentifierReferenceType, 
    partnerTransactionRef, remarks, numOfUsageItem
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    die(json_encode(["error" => "Prepare failed: " . $conn->error]));
}

// Insert each transaction
foreach ($transactions as $transaction) {
    // Ensure all values exist and set defaults
    $transaction = array_merge([
        'document_sid' => '',
        'document_item_sid' => '',
        'type' => '',
        'numOfUsage' => 0,
        'status' => 0,
        'currency' => 'PHP',
        'fullFareAmount' => '',
        'qualifyingAmount' => '',
        'discountedAmount' => '',
        'additionalFees' => '',
        'cancellationFees' => '',
        'discountAmount' => '',
        'discountPercentage' => '',
        'amountEffectiveDate' => null, // Date
        'lineReference' => '',
        'lineDescription' => '',
        'qualifyingTransaction' => 0, // Boolean (Stored as INT)
        'partnerSubCode' => '',
        'sku' => '',
        'uniqueProductRef' => '',
        'productCategory' => '',
        'transactionDate' => null, // Date
        'memberfullName' => '',
        'memberIdentifierReference' => '',
        'memberIdentifierReferenceType' => '',
        'partnerTransactionRef' => '',
        'remarks' => '',
        'numOfUsageItem' => 0
    ], (is_array($transaction) ? $transaction : []));

    // Bind parameters
    $stmt->bind_param(
        "sssiisssssssssssissssssssssi",
        $transaction['document_sid'],
        $transaction['document_item_sid'],
        $transaction['type'],
        $transaction['numOfUsage'],
        $transaction['status'],
        $transaction['currency'],
        $transaction['fullFareAmount'],
        $transaction['qualifyingAmount'],
        $transaction['discountedAmount'],
        $transaction['additionalFees'],
        $transaction['cancellationFees'],
        $transaction['discountAmount'],
        $transaction['discountPercentage'],
        $transaction['amountEffectiveDate'],
        $transaction['lineReference'],
        $transaction['lineDescription'],
        $transaction['qualifyingTransaction'], // BOOLEAN (Stored as INT)
        $transaction['partnerSubCode'],
        $transaction['sku'],
        $transaction['uniqueProductRef'],
        $transaction['productCategory'],
        $transaction['transactionDate'],
        $transaction['memberfullName'],
        $transaction['memberIdentifierReference'],
        $transaction['memberIdentifierReferenceType'],
        $transaction['partnerTransactionRef'],
        $transaction['remarks'],
        $transaction['numOfUsageItem']
    );

    // Execute statement
    if (!$stmt->execute()) {
        echo json_encode(["error" => "Error saving transaction: " . $stmt->error]);
        exit;
    }
}

// Success response
echo json_encode(["success" => "Transactions saved successfully!"]);

// Close connections
$stmt->close();
$conn->close();
?>
