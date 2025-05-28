<?php
	require_once('../../libraries/adodb5/adodb.inc.php');
	require_once('../../config/gticonfig.php');

	class PasscodeGenerator {

		private $request = null;
		private $overwritePasscodeExists = false;
		private $passcodePath = 'passcode.txt';
		private $salt = null;

		public function __construct($request)
		{
			$this->request = $request;
			$this->salt = gethostname();

			switch ($this->request->action) {
				case 'check':
					$this->checkIfPasscodeExists();
					break;
				
				case 'generate':
					$this->generatePasscode();
					break;

				case 'checkPasscode':
					$this->checkPasscode();
					break;
			}
		}

		public function checkIfPasscodeExists() 
		{
			if ($this->overwritePasscodeExists) {
				echo json_encode(['isPasscodeEnable' => true, 'isPasscodeExists' => false]);
				return;
			}

			$isExists = (file_exists($this->passcodePath) && filesize($this->passcodePath));

			echo json_encode(['isPasscodeEnable' => true, 'isPasscodeExists' => $isExists]);
			return;
		}

		public function generatePasscode() 
		{
			$string = $this->request->passcode;

			$passcodeFile = fopen($this->passcodePath, "w") or die("Unable to open file!");
			fwrite($passcodeFile, md5($string . $this->salt));
			fclose($passcodeFile);
			echo json_encode(['isPasscodeEnable' => true]);
			return;
		}

		public function checkPasscode()
		{
			$storedPasscode = file_get_contents($this->passcodePath);


			if ($storedPasscode == md5($this->request->passcode . $this->salt)) {
				echo json_encode(['isPasscodeEnable' => true, 'success' => true]);
			} else {
				echo json_encode(['isPasscodeEnable' => true, 'success' => false]);
			}

			return;
		}
	}

	if (!PASSCODE_ENABLE) {
		echo json_encode(['isPasscodeEnable' => false]);
		return;
	}

	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $request = (object) $_REQUEST;
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $request = (object) $_GET;
    }

    $passcodeGenerator = new PasscodeGenerator($request);