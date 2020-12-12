app.factory('UserService', UserService);

    UserService.$inject = ['$timeout', '$filter', '$q','$http'];
    function UserService($timeout, $filter, $q,$http) {
    	var user=[{"firstName":"Shyam","lastName":"Sreenivasan","email":"shyam.sreenivasan@quantel.ai","password":"shyam"},{"firstName":"Narayan","lastName":"Ganesan","email":"narayan@dvp.com","password":"narayan"},{"firstName":"Rathnakar Reddy","lastName":"P","email":"rathnakar.p@aitacs.com","password":"rathnakar"},{"firstName":"Ramaprakash","lastName":"R","email":"ramaprakash.r@aitacs.com","password":"rama"},{"firstName":"Srikanth","lastName":"A","email":"srikanth.a@aitacs.com","password":"srikanth"}];
		var company=[{"company":"QUANTEL"},{"company":"AITACS"},{"company":"DATAVIEWPARTNERS"}];
        var service = {};        
        service.GetAll = GetAll;
        service.GetById = GetById;
        service.GetByEmail = GetByEmail;
		service.GetByCompany = GetByCompany;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;
        service.formatDate=formatDate

        return service;

        function GetAll() {
            var deferred = $q.defer();
            deferred.resolve(getUsers());
            return deferred.promise;
        }

        function GetById(id) {
            var deferred = $q.defer();
            var filtered = $filter('filter')(getUsers(), { id: id });
            var user = filtered.length ? filtered[0] : null;
            deferred.resolve(user);
            return deferred.promise;
        }

        function GetByEmail(email) {
            var deferred = $q.defer();
            var filtered = $filter('filter')(getUsers(), { email: email });
            var user = filtered.length ? filtered[0] : null;
            deferred.resolve(user);
            return deferred.promise;
        }
		
		function GetByCompany(company) {
            var deferred = $q.defer();
            var filtered = $filter('filter')(getCompanies(), { company: company });
            var company = filtered.length ? filtered[0] : null;
            deferred.resolve(company);
            return deferred.promise;
        }

        function Create(user) {
            var deferred = $q.defer();
            // simulate api call with $timeout
            $timeout(function () {
                GetByEmail(user.email)
                    .then(function (duplicateUser) {
                        if (duplicateUser !== null) {
                            deferred.resolve({ success: false, message: 'Email "' + user.email + '" is already taken' });
                        } else {
                            var users = getUsers();

                            // assign id
                            var lastUser = users[users.length - 1] || { id: 0 };
                            user.id = lastUser.id + 1;

                            // save to local storage
                            users.push(user);
                            setUsers(users);

                            deferred.resolve({ success: true });
                        }
                    });
            }, 1000);

            return deferred.promise;
        }

        function Update(user) {
            var deferred = $q.defer();

            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].id === user.id) {
                    users[i] = user;
                    break;
                }
            }
            setUsers(users);
            deferred.resolve({ success: true });
            return deferred.promise;
        }

        function Delete(id) {
            var deferred = $q.defer();

            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                if (user.id === id) {
                    users.splice(i, 1);
                    break;
                }
            }
            setUsers(users);
            deferred.resolve();

            return deferred.promise;
        }

        // private functions

        function getUsers() {
            	 return user;
        }
		
		function getCompanies() {
            	 return company;
        }

        function setUsers(users) {
            //localStorage.users = JSON.stringify(users);
        }
        
        //Date Format 
        function formatDate(date){

            var dd = date.getDate();
            var mm = date.getMonth()+1;
            var yyyy = date.getFullYear();
            if(dd<10) {dd='0'+dd}
            if(mm<10) {mm='0'+mm}
            date = yyyy+''+mm+''+dd;
            return date
         }
    }
