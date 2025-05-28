<?php

	date_default_timezone_set('Asia/Manila');

	$iniFile = 'manual_queue.ini';

	if (!file_exists($iniFile)) {
		echo json_encode(['success' => false, 'message' => 'Unable to fetch .ini file. Please contact your system administrator.']);
		return;
	}

	try {
		$ini = parse_ini_file($iniFile);
	}
	catch (Exception $e) {
		echo json_encode(['success' => false, 'message' => $e->getMessage()]);
		return;
	}

	if (!isset($ini['count'])) {
		echo json_encode(['success' => false, 'message' => 'Unable to fetch count from .ini file. Please contact your system administrator.']);
		return;
	}

	if (!isset($ini['date'])) {
		echo json_encode(['success' => false, 'message' => 'Unable to fetch date from .ini file. Please contact your system administrator.']);
		return;
	}

	if (!isset($ini['time'])) {
		echo json_encode(['success' => false, 'message' => 'Unable to fetch time from .ini file. Please contact your system administrator.']);
		return;
	}

	if ($ini['date'] != date('Y-m-d')) {
		$ini['count'] = 1;
	}

	echo json_encode(['success' => true, 'count' => $ini['count']]);
	return;
	