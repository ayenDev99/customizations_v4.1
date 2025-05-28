var logModule = window.angular.module('plLogsController', []);
logModule.config(["$httpProvider",
	function setupConfig( $httpProvider ) {

		var isLoginRequest = false;
		var currentCustomer = null;

		// Wire up the traffic cop interceptors. This method will be invoked with
		// full dependency-injection functionality.
		// --
		// NOTE: This approach has been available since AngularJS 1.1.4.
		$httpProvider.interceptors.push(["$q", "defaultLogs", function interceptHttp( $q, defaultLogs ) {
			// Return the interceptor methods. They are all optional and get
			// added to the underlying promise chain.
			return({
				request: request,
				requestError: requestError,
				response: response,
				responseError: responseError
			});

			// Intercept the request configuration.
			function request( config ) {
				// console.log('REQuest:', config);
				// Pass-through original config object.
				return( config );
			};

			// Intercept the failed request.
			function requestError( rejection ) {
				// console.log('Request Error:', rejection);
				// Pass-through the rejection.
				return( $q.reject( rejection ) );
			};

			// Intercept the successful response.
			function response( response ) {
				// console.log('Response:', response);

				if (response.config.url == '/v1/rest/auth') {
					if (typeof response.config.params != 'undefined') {
						isLoginRequest = true;
					}
				}

				if (response.config.url == '/v1/rest/session' && isLoginRequest == true) {
					isLoginRequest = false;
					write({message: 'Login Successful! ' + ' Emp SID: ' + response.data[0].employeesid + ', Emp Name: ' + response.data[0].employeename, 
						csvData: [response.data[0].employeename, 'Log in has been created']});
				}

				if (response.config.url == '/v1/rest/stand') {
					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' has been logout successfully. Emp SID: ' + session.employeesid, 
						csvData: [session.employeename, 'Logout successfully']});
				}

				if (response.config.url.includes('/v1/rest/zoutcontrol/') && response.config.method == 'POST') {
					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' opened a drawer.', 
						csvData: [session.employeename, 'Opened a drawer']});
				}

				if (response.config.url.includes('/v1/rest/zoutcontrol/') && response.config.method == 'PUT' && (typeof response.config.data[0].close_drawer_event_sid != 'undefined')) {
					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' closed a drawer.', 
						csvData: [session.employeename, 'Closed a drawer']});
				}

				if (response.config.url == '/v1/rest/document' && response.config.method == 'POST') {
					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' created new tranasction. SID: ' + response.data[0].sid, 
						csvData: [session.employeename, 'Created new transaction', 'REGULAR']});
				}

				//  Global Discount
				if (response.config.url.includes('/v1/rest/document') && !response.config.url.includes('/item') && response.config.method == 'PUT' && (typeof response.config.data[0].manual_disc_reason != 'undefined')) {
					var splittedURL = response.config.url.split('/');

					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' adding global discount to tranasction: ' + splittedURL[4] + ' ... reason: ' + response.config.data[0].manual_disc_reason + ', total discount amount: ' + response.data[0].discount_amount, 
						csvData: [session.employeename, 'Added global discount to transaction']});
				}

				//  Item Discount
				if (response.config.url.includes('/v1/rest/document') && response.config.url.includes('/item') && response.config.method == 'PUT' && (typeof response.config.data[0].manual_disc_reason != 'undefined')) {
					var splittedURL = response.config.url.split('/');

					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' adding item discount to tranasction: ' + splittedURL[4] + ' item: ' + splittedURL[6] + ' ... reason: ' + response.config.data[0].manual_disc_reason + ', total discount amount: ' + response.data[0].discount_amt, 
						csvData: [session.employeename, 'Added item discount to transaction']});
				}

				if (response.config.url.includes('api/common/customer') && response.config.method == 'GET') {
					currentCustomer = response.data.data[0];				
				}

				if (response.config.url.includes('/v1/rest/document') && response.config.method == 'PUT' && (typeof response.config.data[0].bt_cuid != 'undefined') && currentCustomer != null) {
					var splittedURL = response.config.url.split('/');

					var isDiplomat = 'NO';
					if (currentCustomer.detax) {
						isDiplomat = 'YES';
					}

					var session = JSON.parse(sessionStorage.getItem('session'));
					write({message: session.employeename + ' adding new customer to tranasction: ' + splittedURL[4] + ' ... customer name: ' + currentCustomer.fullname + ', diplomat: ' + isDiplomat, 
						csvData: [session.employeename, 'Added a customer to transaction']});
					currentCustomer = null;
				}

				if (response.config.url.includes('/v1/rest/document') && response.config.method == 'PUT' && (typeof response.config.data[0].status != 'undefined')) {
					if (response.config.data[0].status == 4) {
						var splittedURL = response.config.url.split('/');
						var session = JSON.parse(sessionStorage.getItem('session'));
						write({message: session.employeename + ' completed the tranasction: ' + splittedURL[4] + ' and created a receipt ... Doc NO: ' + response.data[0].document_number, 
						csvData: [session.employeename, 'Completed the tranasction', response.data[0].receipt_type, response.data[0].document_number]});
						currentCustomer = null;
					}
					
				}	

				if (response.config.url.includes('/v1/rest/document') && response.config.method == 'PUT' && (typeof response.config.data[0].ref_sale_sid != 'undefined')) {

					if (response.config.data[0].ref_sale_sid != '') {
						
						var splittedURL = response.config.url.split('/');
						var session = JSON.parse(sessionStorage.getItem('session'));
						write({message: session.employeename + ' Created return transaction: ' + splittedURL[4] + ' and created a receipt ... Doc NO: ' + response.data[0].document_number, 
						csvData: [session.employeename, 'Created return transaction', 'RETURN', response.data[0].document_number]});
						currentCustomer = null;
					}
					
				}

				// Find specific log depends on url, methods and conditions
				return( response );
			};

			// Intercept the failed response.
			function responseError( response ) {
				// console.log('Response Error:', response);
				// Pass-through the rejection.
				return( $q.reject( response ) );
			};
		}]);

		function write(obj) {
			$.ajax({
				url: '/plugins/PLLogs/api/write.php',
				data: { log: obj },
				method: 'POST',
				success: function() {

				}
			});
		};
	}
]);
logModule.service('defaultLogs',
	function setupService() {
		var baseURL = window.location.origin;

		return({
			logs: []
		});
	}
);
