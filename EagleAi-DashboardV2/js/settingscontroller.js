app.controller('SettingsController',SettingsController);

SettingsController.$inject = ['$scope','$q','$http','$cookieStore','$location','$window','UserService','$filter','$interval','$routeParams','$uibModal','$rootScope'];

function SettingsController($scope,$q,$http,$cookieStore,$location,$window,UserService,$filter,$interval,$routeParams,$uibModal,$rootScope) {
    $scope.user=$cookieStore.get("user");
	$rootScope.restAPIServerName =  'http://159.203.112.185:6222';
	const restAPIServerName = $rootScope.restAPIServerName;
	$scope.models=[];
	$rootScope.inputs=[];
	$scope.alertInputs=[];
	$rootScope.outputs=[];
	$scope.selectedInput = [];
	$scope.selectedOutput = [];
	$scope.checkedModels = [];
	$scope.datasource={};
	$scope.datasource.source='logs';
	$scope.datasource.db={};
	$scope.datasource.stream={};
	$scope.logs=[];
	$scope.dbs=[];
	$scope.streams=[];
	$scope.alerts=[];
	$scope.alert={};
	
	//Model Related functionalities
	$http.get(restAPIServerName+"/getModelInputs").then(function(response){
		$scope.inputs=response.data;
		angular.copy($scope.inputs,$rootScope.inputs);
		angular.copy($scope.inputs,$scope.alertInputs);

	});
	
	$http.get(restAPIServerName+"/getModelOutputs").then(function(response){
		$scope.outputs=[];
		angular.forEach(response.data,function(data){
			$scope.outputs.push({get_model_outputs:data.output_type+"_"+data.outputs})
		});
		angular.copy($scope.outputs,$rootScope.outputs);
	});
	
	$scope.moveItem = function(items, from, to) {
		angular.forEach(items,function(item){
			var idx=from.indexOf(item);
			if (idx != -1) {
				from.splice(idx, 1);
				to.push(item);      
			}
		})
    };
    $scope.moveAll = function(from, to) {
        angular.forEach(from, function(item) {
            to.push(item);
        });
        from.length = 0;
    };
	
	$scope.addModel=function(){
		$scope.models.push({inputs:$scope.selectedInput,outputs:$scope.selectedOutput});
		angular.copy($rootScope.inputs,$scope.inputs);
		angular.copy($rootScope.outputs,$scope.outputs);
		$scope.selectedInput = [];
		$scope.selectedOutput = [];
	}
	
	$scope.checkModel=function(checked,model){
		var idx=$scope.checkedModels.indexOf(model);
		if (idx != -1 && checked==false) {
			$scope.checkedModels.splice(idx, 1);			    
		}else if (idx == -1 && checked==true) {
			$scope.checkedModels.push(model);			    
		}
	}
	
	$scope.remove=function(){
		angular.forEach($scope.checkedModels,function(models){
			var idx=$scope.models.indexOf(models);
			if (idx != -1) {
				$scope.models.splice(idx, 1);
			}
		})
	}
	
	//End of model reated Functionlities
	
	//Logs related Functions
	$scope.addLogs=function(){
		$scope.logs.push({path:$scope.datasource.logPath});
		$scope.datasource.logPath='';
	}
	$scope.checkedLogs=[];
	$scope.checkLogs=function(checked,log){
		var idx=$scope.checkedLogs.indexOf(log);
		if (idx != -1 && checked==false) {
			$scope.checkedLogs.splice(idx, 1);			    
		}else if (idx == -1 && checked==true) {
			$scope.checkedLogs.push(log);			    
		}
	}
	
	$scope.removeLog=function(){
		angular.forEach($scope.checkedLogs,function(log){
			var idx=$scope.logs.indexOf(log);
			if (idx != -1) {
				$scope.logs.splice(idx, 1);
			}
		})
	}
	
	//End of Logs related Functions
	
	//Dbs related Functions
	$scope.addDbs=function(){
		$scope.dbs.push($scope.datasource.db);
		console.log($scope.dbs);
		$scope.datasource.db={};
	}
	
	$scope.checkedDbs=[];
	$scope.checkDbs=function(checked,db){
		var idx=$scope.checkedDbs.indexOf(db);
		if (idx != -1 && checked==false) {
			$scope.checkedDbs.splice(idx, 1);			    
		}else if (idx == -1 && checked==true) {
			$scope.checkedDbs.push(db);			    
		}
	}
	
	$scope.removeDb=function(){
		angular.forEach($scope.checkedDbs,function(db){
			var idx=$scope.dbs.indexOf(db);
			if (idx != -1) {
				$scope.dbs.splice(idx, 1);
			}
		})
	}
	
	//End of Dbs related Functions
	
	//Streams related Functions
	$scope.addStreams=function(){
		$scope.streams.push($scope.datasource.stream);
		$scope.datasource.stream={};
	}
	$scope.checkedStreams=[];
	$scope.checkStreams=function(checked,stream){
		var idx=$scope.checkedStreams.indexOf(stream);
		if (idx != -1 && checked==false) {
			$scope.checkedStreams.splice(idx, 1);			    
		}else if (idx == -1 && checked==true) {
			$scope.checkedStreams.push(stream);			    
		}
	}
	
	$scope.removeStream=function(){
		angular.forEach($scope.checkedStreams,function(stream){
			var idx=$scope.streams.indexOf(stream);
			if (idx != -1) {
				$scope.streams.splice(idx, 1);
			}
		})
	}
	
	//End of Streams related Functions
	
	//Alerts Related Functionalities
	$scope.addAlert=function(){
		$scope.alerts.push($scope.alert);
		console.log($scope.alerts);
		$scope.alert={};
	}
	$scope.checkedAlerts=[];
	$scope.checkAlerts=function(checked,alert){
		var idx=$scope.checkedAlerts.indexOf(alert);
		if (idx != -1 && checked==false) {
			$scope.checkedAlerts.splice(idx, 1);			    
		}else if (idx == -1 && checked==true) {
			$scope.checkedAlerts.push(alert);			    
		}
	}
	
	$scope.removeAlert=function(){
		angular.forEach($scope.checkedAlerts,function(alert){
			var idx=$scope.alerts.indexOf(alert);
			if (idx != -1) {
				$scope.alerts.splice(idx, 1);
			}
		})
	}
	//End of Alerts Related Functionalities
}

app.filter('join', function () {
    return function join(array, separator, prop) {
        if (!Array.isArray(array)) {
            return array; // if not array return original - can also throw error
        }

        return (!angular.isUndefined(prop) ? array.map(function (item) {
            return item[prop];
        }) : array).join(separator);
    };
});
