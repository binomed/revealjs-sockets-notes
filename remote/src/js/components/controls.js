components.directive('controls', ['$rootScope', '$timeout'
  ,function ($rootScope, $timeout ) {
   var directiveDefinitionObject = {
    templateUrl: 'partials/components/controls.html',
    replace: true,
    require: '^iframeControl',
    priority : 901,
    restrict: 'E',
    scope: true,    
    link: function postLink($scope, iElement, iAttrs, iframeCtrl) { 

    
      $scope.classShow = '';
      $scope.classBack = '';
      $scope.showBack = true;
      var indices = null;

      $scope.$watch('model.indices', function(){
        $scope.classShow = '';
        $scope.classBack = $scope.classBack.indexOf('visible') != -1 ? 'visible' : '';
        $timeout(function() {
          $scope.classShow = 'hide';
          $scope.classBack += ' hide';
        }, 500);
      });
      
      $scope.leftClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          reset();
          iframeCtrl.revealAction('left');
        }
      }
      
      $scope.rightClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          reset();
          iframeCtrl.revealAction('right');
        }
      }
      
      $scope.upClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          reset();
          iframeCtrl.revealAction('up');
        }
      }
      
      $scope.downClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          reset();
          iframeCtrl.revealAction('down');
        }
      }
      
      $scope.resetClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          reset();
          iframeCtrl.revealAction('reset');
        }
      }
      
      $scope.showClick = function($event){
        if (!$event.target.hasAttribute('disabled')) {
          $scope.classShow = '';
          $scope.classBack = '';
          indices = null;
          iframeCtrl.revealAction('next');
          $scope.sendMessage({
              type : 'operation', 
              data : 'show', 
              index: $scope.model.indices, 
              fragment : $scope.model.fragment
          });
        }
      }

      $scope.back = function(){
        $scope.classBack = '';
        $scope.model.indices.h = indices.h;
        $scope.model.indices.v = indices.v;
        iframeCtrl.revealAction('back');
      }

      function reset(){
        $scope.classShow = '';
        $scope.classBack = 'visible';
        if (indices == null){
          indices = {
            h : $scope.model.indices.h, 
            v : $scope.model.indices.v
          };
         }
      }


      // We add a managment of gesture in order to control the reveal presentation
      $(iElement[0]).hammer().on('release', function(event){
        if (event.gesture && event.gesture.direction && event.gesture.distance > 1){
          reset();
          if (event.gesture.direction === 'left'){
            iframeCtrl.revealAction('next');
          }else if (event.gesture.direction === 'right'){
            iframeCtrl.revealAction('prev');
          }else if (event.gesture.direction === 'up' && !$scope.model.controls.down){
            iframeCtrl.revealAction('down');
          }else if (event.gesture.direction === 'down' && !$scope.model.controls.up){
            iframeCtrl.revealAction('up');
          }

        }
      });

     
    }
  };
  return directiveDefinitionObject;
}]);