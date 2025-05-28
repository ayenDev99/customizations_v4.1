ButtonHooksManager.addHandler(['before_navLandingZOut'], ($q, authService) => {
	var deferred = $q.defer();

	return new Promise(function(resolve, reject) {
        $.ajax({
			url: '/plugins/PasscodeGenerator/PasscodeGenerator.php',
			method: 'POST',
			data: { action: 'check' },
			complete: function(data) {
				var result = JSON.parse(data.responseText);

				if (!result.isPasscodeEnable) {
					resolve({success: true, message: 'Passcode is not enabled.'});
				} else {

					authService.checkLicense().then(function(checkLicense) {
						if (checkLicense) {
							if (result.isPasscodeExists) {
								checkPasscode().then((success) => {
									if (success) resolve();
								});
							} else {
								var passcode = prompt('Enter new passcode:', '');
								if (passcode != null && passcode != "") {
									var repasscode = prompt('Re-enter passcode:', '');
									if (passcode == repasscode) {
										$.ajax({
											url: '/plugins/PasscodeGenerator/PasscodeGenerator.php',
											method: 'POST',
											data: { action: 'generate', passcode: passcode },
											success: function() {
												alert('Passcode has been successfully created.');
												checkPasscode().then((success) => {
													if (success) resolve();
												});
											}
										});
									} else {
										alert('Passcode did not match.');
									}
								}
							}
				        } else {
				        	resolve();
				        }
					});
				}
			}
		});
	
	}).then((data) => {
		console.log(data);
	});
});


function checkPasscode() {
	return new Promise(function(resolve, reject) {
		var passcode = prompt('Enter passcode:', '');
		if (passcode != null && passcode != "") {
			$.ajax({
				url: '/plugins/PasscodeGenerator/PasscodeGenerator.php',
				method: 'POST',
				data: { action: 'checkPasscode', passcode: passcode },
				success: function(data) {
					var result = JSON.parse(data);
					if (result.success) {
						resolve(true);
					} else {
						alert('Unable to proceed. Passcode is incorrect.');
						resolve(false);
					}
				}
			});
		}
	});
}