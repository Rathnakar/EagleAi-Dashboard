app.controller('ApiController',ApiController);

ApiController.$inject = ['$scope'];

function ApiController($scope) {
	const apiurl = 'http://159.203.112.185:7878/client_pred_vs_obs';
	const apisocket = io.connect(apiurl);
	
	//On message from RMS API
	apisocket.on('client_update',function (data) {
		console.log(data);
		document.getElementById("rms").innerHTML=data;

	}); 
	
	//RMS API connect
	apisocket.on('connect', () => {
		console.log("Connected to RMS API");
		apisocket.emit('client_update')
	});

	
}