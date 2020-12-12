app.controller('LoginController', LoginController);

    LoginController.$inject = ['$location', 'AuthenticationService','$cookieStore','UserService','$scope'];
    function LoginController($location, AuthenticationService,$cookieStore,UserService,$scope) {
		$scope.showCompany=false;
		 $scope.showLogin=function(){
			AuthenticationService.checkCompany($scope.user.company, function (response) {
                if (response.success) {
                   	$scope.showCompany=true;
                } else {
                	$scope.error="Login failed,No Company Found"
                }
            });
		}
        $scope.login=function() {
            AuthenticationService.Login($scope.user.email,$scope.user.password, function (response) {
                if (response.success) {
                    AuthenticationService.SetCredentials($scope.user.email,$scope.user.password);
                    $cookieStore.put("user",response.data);
                   	$location.path('/homedashboardv');
                } else {
                	$scope.error="Login failed,No User Found"
                }
            });
        };
    }