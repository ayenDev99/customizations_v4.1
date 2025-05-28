<?php

	date_default_timezone_set('Asia/Manila');

	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	// $payloadKeys = (isset($_REQUEST)) ? $_REQUEST : $_POST ;

	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
		$postdata   = file_get_contents("php://input");
        $request    = json_decode($postdata);
	}
        
	$payloadKeys = [];

	foreach ($request as $dataKey => $paths) {
		foreach ($paths->paths as $pathKey => $path) {
			foreach ($path->keys as $keyKey => $key) {
				$payloadKeys[$key->slug] = $key;
			}
		}
	}

	// echo "<pre>";

	// print_r($payloadKeys);
	// die();
	// $tempHotkeys = [];

	// Read JSON file
	$jsonData = file_get_contents('hotkeys.json');
	$data = json_decode($jsonData);


	// echo "<pre>";
	foreach ($data as $dataKey => $paths) {
		foreach ($paths->paths as $pathKey => $path) {
			foreach ($path->keys as $keyKey => $key) {

				if (isset($payloadKeys[$key->slug])) {
					// print_r($data->$dataKey->paths[$pathKey]->keys[$keyKey]);
					// print_r($payloadKeys[$key->slug]);
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->keylabel = $payloadKeys[$key->slug]->keylabel;
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->keycode = intval($payloadKeys[$key->slug]->keycode);
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->ctrlKey = ($payloadKeys[$key->slug]->ctrlKey == '1') ? true : false ;
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->altKey = ($payloadKeys[$key->slug]->altKey == '1') ? true : false ;
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->shiftKey = ($payloadKeys[$key->slug]->shiftKey == '1') ? true : false ;
					$data->$dataKey->paths[$pathKey]->keys[$keyKey]->metaKey = ($payloadKeys[$key->slug]->metaKey == '1') ? true : false ;
				}
			}
		}
	}

	file_put_contents('hotkeys.json', json_encode($data, JSON_PRETTY_PRINT));

	echo json_encode(['success' => true, 'message' => 'Shortcut Keys/Hotkeys have been successfully saved.']);

	// print_r($data);
