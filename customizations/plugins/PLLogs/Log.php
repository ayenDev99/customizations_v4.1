<?php
	date_default_timezone_set('Asia/Manila');

	class Log {
		private $file_path = '../logs/';

		// Properties
		private $id;
		private $log_name;
		private $user_id;
		private $created_at;
		private $subsidiary_sid;

		// Constructor
		function __construct() {

		}

		public function setSubsidiarySID($sbs_sid) {
			$this->subsidiary_sid = $sbs_sid;
		}

		/*
		 * Insert new log
		 * - write log into DB
		 * - retrive current or add new file
		 * - write log into file
		 *
		 * @param $data 	array (*name and *description)
		 */
		public function write($data) {	
			$messages = [];

			$dir = '../trail';

	        if (!file_exists($dir)) {
	            mkdir($dir, 0777, true);
	        }
        
	        $dir = '../trail/' . date('Y_m_d');

	        if (!file_exists($dir)) {
	            mkdir($dir, 0777, true);
	        }

	        $txt = $dir . '/log.txt';

	        if (!file_exists($txt)) {
	            $messages[] = 'New log has been created.';
	        }

	        $messages[] = $data['message'];

	        $txtFile = fopen($txt, "a+") or die("Unable to open file!");

	        foreach ($messages as $msg) {
	            fwrite($txtFile, '[' . date('Y-m-d H:i:sa') . '] ' . $msg . PHP_EOL);
	        } 
	         fclose($txtFile);

	        $csv = $dir . '/log.csv';

	        $df = fopen($csv, 'a+' ) or die("Unable to open file!");

	       	if (isset($data['csvData'])) {
	       		$date = [date('Y-m-d H:i:sa')];
	       		$csvData = array_merge($date, $data['csvData']);
	        	fputcsv($df, $csvData);
	       	}
	        
	        fclose($df);
	        
	       
		}

	}