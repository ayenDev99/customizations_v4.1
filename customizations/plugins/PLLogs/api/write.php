<?php
	// Headers
	header('Access-Control-Allow-Origin: *');
	header('Content-Type: application/json');

	require_once('../Log.php');

	// Initiate model Log
	$log = new Log;

	if (isset($_REQUEST['log'])) {
		$log->write($_REQUEST['log']);
	}