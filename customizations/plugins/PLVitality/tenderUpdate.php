<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-vitality-legal-entity-id, x-aia-request-id");
header('Access-Control-Allow-Methods: POST');
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fetch Authorization header from the request
$headersFromRequest = getallheaders();
$authorization = isset($headersFromRequest['Authorization']) ? $headersFromRequest['Authorization'] : null;

if (!$authorization) {
    http_response_code(401);
    echo json_encode(["error" => "Access token is missing or invalid."]);
    exit;
}

// Read the input JSON data
$inputData = json_decode(file_get_contents('php://input'), true);
$transactions = isset($inputData['transactions']) ? $inputData['transactions'] : null;

if (!$transactions) {
    http_response_code(400);
    echo json_encode(["error" => "Transactions data is missing."]);
    exit;
}

// Define the API URL
$apiUrl = "https://qa.vitality.aia.com/vitality/partnerproxy/v1/transaction/bulk?partner-code=TOBYSPORTSPH&partner-sub-code=TOBSPRT%27";

$entityId = "8";  
$requestId = "TOBYSPORTSPH"; 


// Prepare the headers for the API request
$headers = [
    "x-vitality-legal-entity-id: 8",
    "x-aia-request-id: TOBYSPORTSPH",
    "Content-Type: application/json",
    "Authorization: Bearer 9c67fcb6147c4e7983b378fd0271db99",
];

// Prepare the data to be sent
$inputDataJson = json_encode(["transactions" => $transactions]);

// Initialize cURL
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_CAINFO, "C:\Program Files (x86)\Genie Technologies Inc\php\extras\ssl\cacert.pem");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTP_VERSION,CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputDataJson);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute cURL request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Close the cURL connection
curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode(["error" => "cURL Error: $error"]);
    exit;
}

// Return the response
http_response_code($httpCode);
echo $response;
