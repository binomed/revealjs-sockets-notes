components.directive('slidingMenu', ['$rootScope','$injector'
  ,function ($rootScope,$injector) {
   var directiveDefinitionObject = {
    templateUrl: 'partials/components/slidingmenu.html',
    replace: true,
    priority : 903,
    restrict: 'E',
    scope: true,    
    link: function postLink($scope, iElement, iAttrs) { 

      
      $scope.activeFilter = function(plugin){
        return plugin.active;
      }

      $scope.pluginClicked = function(plugin){
        $scope[plugin.id + 'Click']();
        $scope.model.showMenuClass = 'collapse';
      }

      $scope.stop = function(){
        $rootScope.$broadcast('resetTimer');  
      }


      $scope.fullscreen = function(){
        if (document.fullscreenElement || 
            document.webkitFullscreenElement ||
            document.mozFullscreenElement){
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }else{
            var docElm = document.getElementById("main-content");
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            }
            else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            }
            else if (docElm.webkitRequestFullscreen) {
                docElm.webkitRequestFullscreen();
            }
        }
      }

      // We add a managment of gesture in order to control the reveal presentation
      // We have to avoid to detect drag on controls (except when controls are not shown)
      var expandDirection = true;
      $(document.body).hammer().on('touch drag dragstart dragleft dragright release', function(event){
        if (event.gesture && event.gesture.direction && event.gesture.distance > 1 
            && ((event.target.id && event.target.id != "controls")
               || !event.target.id)
              ){
          event.gesture.preventDefault();
          $scope.$apply(function(){
            if (event.type === 'release'){
              iElement[0].style[Modernizr.prefixed('transform')] = '';
              if (event.gesture.direction === 'left'){
                $scope.model.showMenuClass = 'collapse';                
              }else if (event.gesture.direction === 'right'){
                $scope.model.showMenuClass = 'expand';
                iElement.css('left', '');
              }
            }else if (event.type === 'dragstart' || event.type === 'touch'){
              expandDirection = $scope.model.showMenuClass === 'collapse';
            }else if (event.type === 'drags' || event.type === 'dragleft'  || event.type === 'dragright'){
              $scope.model.showMenuClass = '';
              var delta = expandDirection ? event.gesture.deltaX : Math.round( (screen.width * 0.8) + event.gesture.deltaX);
              iElement[0].style[Modernizr.prefixed('transform')] = 'translateX('+delta+'px)';
            }
          });
        }
      }); 

    }
  };
  return directiveDefinitionObject;
}]);