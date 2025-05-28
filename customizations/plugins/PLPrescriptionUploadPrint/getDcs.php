<?php
session_start();

// Establish database connection
// require_once('../../config/gticonfig.php');

// Establish database connection
// $host = SYSCONFIG_DB_MYSQL_HOST;
// $user = SYSCONFIG_DB_MYSQL_USER;
// $password = SYSCONFIG_DB_MYSQL_PASS;
// $database = SYSCONFIG_DB_MYSQL_NAME;

$host = '127.0.0.1';
$user = 'root';
$password = 'sysadmin';
$database = 'rpsods';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Handle potential errors
try {
    // Ensure required parameters are set
    if (!isset($_GET['dcs_code'], $_GET['sbs_sid'])) {
        throw new Exception('Missing required parameters.');
    }

    // Validate and sanitize input
    $dcs_code = $_GET['dcs_code'];
    $sbs_sid = $_GET['sbs_sid'];

    // Prepare the SQL query
    $query = "SELECT sid FROM dcs WHERE dcs_code = '" . $dcs_code . "' AND sbs_sid = " . $sbs_sid . "  ";

    // print_r($query);
    // return;
    // Execute the query
    $result = $conn->query($query);

    // Convert result to JSON
    $data = [];
    if ($result) {
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
    } else {
        throw new Exception('Query execution failed: ' . $conn->error);
    }

    // Send JSON response
    header('Content-Type: application/json');
    echo json_encode($data);

} catch (Exception $e) {
    // Handle exceptions
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array('error' => $e->getMessage()));
}

// Close database connection
$conn->close();
?>
