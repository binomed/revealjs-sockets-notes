/*
* Video Play plugin
*/
plugins.directive('vpPlugin', ['$rootScope'
  ,function ($rootScope) {
   var directiveDefinitionObject = {
    restrict: 'A',
    priority : 100,
    scope: false,    
    link: function postLink($scope, iElement, iAttrs) { 

      $scope.register({
        name : 'play video',
        icon : 'fa-youtube-play',
        id : 'vp'
      });


      $scope.vpClick = function(){
        $scope.pluginCommunication('vp', {});
      }
    }
  };
  return directiveDefinitionObject;
}]);