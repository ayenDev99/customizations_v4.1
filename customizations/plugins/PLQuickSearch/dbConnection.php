<?php
session_start();

// Establish database connection
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
    if (!isset($_GET['lookupFields'], $_GET['sbs_sid'], $_GET['store_sid'])) {
        throw new Exception('Missing required parameters.');
    }

    // Validate and sanitize input
    $lookupFields = $_GET['lookupFields'];
    $sbs_sid = $_GET['sbs_sid'];
    $store_sid = $_GET['store_sid'];

    // Prepare the SQL query
    $config_lookUpOrderBy = isset($_GET['lookUpOrderBy']) && !empty($_GET['lookUpOrderBy']) ? "ORDER BY " . $_GET['lookUpOrderBy'] : "";
    $query = "SELECT " . $lookupFields . ", a.sid, a.kit_type FROM 
        invn_sbs_item a 
        LEFT JOIN invn_sbs_item_qty b on a.sid= b.invn_sbs_item_sid AND a.sbs_sid = " . $sbs_sid . " AND store_sid = " . $store_sid . "
        LEFT JOIN invn_sbs_price c on a.sid = c.invn_sbs_item_sid AND a.sbs_sid = " . $sbs_sid . " AND store_sid = " . $store_sid . "
        LEFT JOIN invn_sbs_extend d on a.sid = d.invn_sbs_item_sid AND a.sbs_sid = " . $sbs_sid . " AND store_sid = " . $store_sid . " 
        " . $config_lookUpOrderBy;

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
