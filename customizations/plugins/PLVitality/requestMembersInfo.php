<?php
// Make the base URL dynamic
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST']; 
$baseUrl = $protocol . $host . "/";

// Set headers
header("Access-Control-Allow-Origin: " . $baseUrl); // Allow only the specific dynamic origin
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-vitality-legal-entity-id, x-aia-request-id");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['barcode']) || empty($data['barcode'])) {
    echo json_encode(["error" => "Missing barcode parameter"]);
    exit;
}

$barcode = urlencode($data['barcode']);

// Basic Auth credentials
$username = '0ceec2eaf7904c7f801f696c42537531';
$password = '9710636eecdd4454944c4b63b233bd94';
$authHeader = "Authorization: Basic " . base64_encode("$username:$password");

// Retrieve access token
$tokenUrl = $baseUrl . "plugins/PLVitality/requestToken.php";

// cURL request to requestToken.php with Basic Auth
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [$authHeader]);

$tokenResponse = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($tokenResponse, true);

if (!isset($tokenData['access_token'])) {
    echo json_encode(["error" => "Failed to retrieve access token"]);
    exit;
}

$accessToken = $tokenData['access_token'];

// API URL
$apiUrl = "https://qa.vitality.aia.com/vitality/partnerproxy/v1/eligibility?" .
          "partner-code=TOBYSPORTSPH&partner-sub-code=TOBSPRT" .
          "&member-identifier-reference={$barcode}" .
          "&member-identifier-reference-type=MEMBERSHIPNO";

// Headers for API request
$headers = [
    "x-vitality-legal-entity-id: 8",
    "x-aia-request-id: TOBYSPORTSPH",
    "Authorization: Bearer " . $accessToken,
    "Accept: application/json"
];

// cURL request to external API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return API response
http_response_code($httpCode);
echo $response;
