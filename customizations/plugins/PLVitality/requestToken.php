<?php
// Allow cross-origin requests (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Handle preflight requests for CORS (OPTIONS request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API URL for the OAuth2 token request
$url = 'https://qa.vitality.aia.com/vitality/security/v1/oauth2/token';

// Define the request payload
$data = 'grant_type=client_credentials';

// Basic Auth credentials
$username = '0ceec2eaf7904c7f801f696c42537531';
$password = '9710636eecdd4454944c4b63b233bd94';
$authHeader = 'Authorization: Basic ' . base64_encode("$username:$password");

// Initialize cURL session
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);  // API endpoint
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  // Return response as a string
curl_setopt($ch, CURLOPT_POST, true);  // Use POST method
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    $authHeader
]);

// Attach the form-encoded data
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

// Execute cURL request
$response = curl_exec($ch);

// Handle cURL errors if any
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
} else {
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    http_response_code($http_code);
    echo $response;
}

curl_close($ch);
?>
