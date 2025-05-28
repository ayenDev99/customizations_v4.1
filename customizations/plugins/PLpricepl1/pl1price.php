<?php
	//require_once('../../libraries/adodb5/adodb.inc.php');
	//require_once('../../config/gticonfig.php');
	

	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $request = file_get_contents('php://input');
        $request = json_decode($request);
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $request = (object) $_GET;
    }

	getQTY($request);

	function getQTY($request){
		$sid = $request->sid;
		// echo $sid;
		$servername = "localhost";
		$username = "root";
		$password = "sysadmin";
		$database = "rpsods";

		$conn = new mysqli($servername, $username, $password, $database);
		if ($conn->connect_error) {
    		die("Connection failed: " . $conn->connect_error);
		}

		// SQL query
		$query = "SELECT SUM(b.qty) as total FROM rpsods.invn_sbs_item a 
		          LEFT JOIN rpsods.invn_sbs_item_qty b ON (a.sid = b.invn_sbs_item_sid)
		          WHERE a.sid = ".$sid;

		// Execute the query
		$result = $conn->query($query);

		// Check for errors
		if (!$result) {
		    die("Query failed: " . $conn->error);
		}

		// Fetch the result as an associative array
		$row = $result->fetch_assoc();

		// Close the database connection
		$conn->close();

		// Return the result as JSON
		echo json_encode($row);
	}