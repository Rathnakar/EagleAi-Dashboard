var app = angular.module('app', [ 'ngRoute', 'ngCookies',
		'ui.bootstrap.accordion', 'ui.bootstrap', 'ngMaterial',
		'material.svgAssetsCache', 'multipleDatePicker' ]);

app.config(function($routeProvider, $locationProvider) {
	$routeProvider.when('/', {
		controller : 'LoginController',
		templateUrl : 'views/login.html'
	}).when('/api', {
		controller : 'ApiController',
		templateUrl : 'views/api.html'
	}).when('/login', {
		controller : 'LoginController',
		templateUrl : 'views/login.html',
		controllerAs : 'vm'
	}).when('/homews', {
		controller : 'HomewsController',
		templateUrl : 'views/homews.html'
	}).when('/homedashboard', {
		controller : 'HomeDashBoardController',
		templateUrl : 'views/homedashboard.html'
	}).when('/homedashboardv', {
		controller : 'HomeDashBoardV2Controller',
		templateUrl : 'views/homedashboardv2.html'
	}).when('/settings', {
		controller : 'SettingsController',
		templateUrl : 'views/settings.html'
	}).otherwise({
		redirectTo : '/login'
	});
}).run(
		function($rootScope, $location, $cookieStore, $http) {
			// keep user logged in after page refresh
			$rootScope.globals = $cookieStore.get('globals') || {};
			$rootScope.$on('$locationChangeStart', function(event, next,
					current) {
				// redirect to login page if not logged in and trying to access a restricted page
				var restrictedPage = $.inArray($location.path(), [ '/login',
						'/register' ]) === -1;
				var loggedIn = $rootScope.globals.currentUser;
				if ($location.path() != '/register') {
					if (!loggedIn) {
						$location.path('/login');
					}
				}
			});

			//Datepicker related code
			$rootScope.today = function() {
				$rootScope.dt = new Date();
			};
			$rootScope.today();

			$rootScope.options = {
				customClass : getDayClass,
				minDate : new Date(),
				maxDate : new Date(),
				showWeeks : false
			};
			$rootScope.openCalendar = function() {
				$rootScope.calendar.opened = true;
			};
			$rootScope.closeCalendar = function() {
				$rootScope.calendar.opened = false;
			};
			$rootScope.calendar = {
				opened : false
			};

			$rootScope.toggleMin = function() {
				$rootScope.options.minDate = $rootScope.options.minDate ? null
						: new Date();
			};

			$rootScope.toggleMin();

			$rootScope.setDate = function(year, month, day) {
				$rootScope.dt = new Date(year, month, day);
			};

			var tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			var afterTomorrow = new Date(tomorrow);
			afterTomorrow.setDate(tomorrow.getDate() + 1);
			$rootScope.events = [ {
				date : tomorrow,
				status : 'full'
			}, {
				date : afterTomorrow,
				status : 'partially'
			} ];

			function getDayClass(data) {
				var date = data.date, mode = data.mode;
				if (mode === 'day') {
					var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

					for (var i = 0; i < $rootScope.events.length; i++) {
						var currentDay = new Date($rootScope.events[i].date)
								.setHours(0, 0, 0, 0);

						if (dayToCheck === currentDay) {
							return $rootScope.events[i].status;
						}
					}
				}
				return '';
			}
		});

app.directive('phoneInput', function($filter, $browser) {
	return {
		require : 'ngModel',
		link : function($scope, $element, $attrs, ngModelCtrl) {
			var listener = function() {
				var value = $element.val().replace(/[^0-9]/g, '');
				$element.val($filter('mobile')(value, false));
			};

			// This runs when we update the text field
			ngModelCtrl.$parsers.push(function(viewValue) {
				return viewValue.replace(/[^0-9]/g, '').slice(0, 10);
			});

			// This runs when the model gets updated on the scope directly and keeps our view in sync
			ngModelCtrl.$render = function() {
				$element.val($filter('mobile')(ngModelCtrl.$viewValue, false));
			};

			$element.bind('change', listener);
			$element.bind('keydown', function(event) {
				var key = event.keyCode;
				// If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
				// This lets us support copy and paste too
				if (key == 91 || (15 < key && key < 19)
						|| (37 <= key && key <= 40)) {
					return;
				}
				$browser.defer(listener); // Have to do this or changes don't get picked up properly
			});

			$element.bind('paste cut', function() {
				$browser.defer(listener);
			});
		}

	};
});

app.filter('uppercase', function() {
	return function(string, firstCharOnly) {
		return (!firstCharOnly) ? string.toUpperCase() : string.charAt(0)
				.toUpperCase()
				+ string.slice(1);
	}
});

app.directive('capitalize', function() {
	return {
		require : 'ngModel',
		link : function(scope, element, attrs, modelCtrl) {
			var capitalize = function(inputValue) {
				if (inputValue == undefined)
					inputValue = '';
				var capitalized = inputValue.toUpperCase();
				if (capitalized !== inputValue) {
					// see where the cursor is before the update so that we can set it back
					var selection = element[0].selectionStart;
					modelCtrl.$setViewValue(capitalized);
					modelCtrl.$render();
					// set back the cursor after rendering
					element[0].selectionStart = selection;
					element[0].selectionEnd = selection;
				}
				return capitalized;
			}
			modelCtrl.$parsers.push(capitalize);
			capitalize(scope[attrs.ngModel]); // capitalize initial value
		}
	};
});

app.filter('mobile', function() {
	return function(mobile) {

		if (!mobile) {
			return '';
		}

		var value = mobile.toString().trim().replace(/^\+/, '');

		if (value.match(/[^0-9]/)) {
			return mobile;
		}

		var country, city, number;

		switch (value.length) {
		case 1:
		case 2:
		case 3:
			city = value;
			break;

		default:
			city = value.slice(0, 3);
			number = value.slice(3);
		}

		if (number) {
			if (number.length > 3) {
				number = number.slice(0, 3) + '-' + number.slice(3, 7);
			} else {
				number = number;
			}

			return ("(" + city + ") " + number).trim();
		} else {
			return "(" + city;
		}

	};
});