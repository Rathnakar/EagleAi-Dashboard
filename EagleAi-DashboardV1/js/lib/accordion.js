angular.module('ui.bootstrap.accordion', []);
angular.module('ui.bootstrap.accordion').controller('AccordionController', ['$scope', function ($scope) {

  var groups = $scope.groups = [];

  this.select = function(group) {
    angular.forEach(groups, function (group) {
      group.selected = false;
    });
    group.selected = true;
  };

  this.toggle = function(group) {
    if (group.selected) {
      group.selected = false;
    } else {
      this.select(group);
    }
  };

  this.addGroup = function(group) {
    groups.push(group);
    if(group.selected) {
      this.select(group);
    }
  };

  this.removeGroup = function(group) {
    groups.splice(groups.indexOf(group), 1);
  };

}]);

/* accordion: Bootstrap accordion implementation
 * @example
 <accordion>
   <accordion-group title="sth">Static content</accordion-group>
   <accordion-group title="sth">Static content - is it? {{sth}}</accordion-group>
   <accordion-group title="group.title" ng-repeat="group in groups">{{group.content}}</accordion-group>
 </accordion>
 */
angular.module('ui.bootstrap.accordion').directive('accordion', function () {
  return {
    restrict:'E',
    transclude:true,
    scope:{},
    controller:'AccordionController',
    template:'<div class="accordion" ng-transclude></div>'
  };
});

angular.module('ui.bootstrap.accordion').directive('accordionGroup', function () {
  return {
    require:'^accordion',
    restrict:'E',
    transclude:true,
    scope:{
      title:'='
    },
    link: function(scope, element, attrs, accordionCtrl) {

      accordionCtrl.addGroup(scope);

      scope.select = function() {
        accordionCtrl.select(scope);
      };

      scope.toggle = function() {
        accordionCtrl.toggle(scope);
      };

      scope.$on('$destroy', function (event) {
        accordionCtrl.removeGroup(scope);
      });
    },
    template:'<div class="accordion-group"><div class="accordion-heading" ng-click="toggle()" title="{{title}}"><a class="accordion-toggle">{{title}}</a></div><div class="accordion-body collapse" ng-class="{in : selected}" title="{{title}}"><div class="accordion-inner" ng-transclude></div></div></div>',
    replace:true
  };
});
