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

	$payload = (isset($_REQUEST['payload'])) ? $_REQUEST['payload'] : $_POST['payload'] ;
	$data = json_decode($payload, true);

	$ini['count'] = $data['count'] + 1;
	$ini['date'] = date('Y-m-d');
	$ini['time'] = date('H:i');

	write_php_ini($ini, $iniFile);

	echo json_encode(['success' => true, 'count' => $ini['count']]);
	return;
	
	function write_php_ini($array, $file)
	{
	    $res = array();
	    foreach($array as $key => $val)
	    {
	        if(is_array($val))
	        {
	            $res[] = "[$key]";
	            foreach($val as $skey => $sval) $res[] = "$skey = ".(is_numeric($sval) ? $sval : '"'.$sval.'"');
	        }
	        else $res[] = "$key = ".(is_numeric($val) ? $val : '"'.$val.'"');
	    }
	    safefilerewrite($file, implode("\r\n", $res));
	}

	function safefilerewrite($fileName, $dataToSave)
	{    if ($fp = fopen($fileName, 'w'))
	    {
	        $startTime = microtime(TRUE);
	        do
	        {            $canWrite = flock($fp, LOCK_EX);
	           // If lock not obtained sleep for 0 - 100 milliseconds, to avoid collision and CPU load
	           if(!$canWrite) usleep(round(rand(0, 100)*1000));
	        } while ((!$canWrite)and((microtime(TRUE)-$startTime) < 5));

	        //file was locked so now we can store information
	        if ($canWrite)
	        {            fwrite($fp, $dataToSave);
	            flock($fp, LOCK_UN);
	        }
	        fclose($fp);
	    }
	}