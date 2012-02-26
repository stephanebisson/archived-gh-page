var app = angular.module('app', []);

app.run(function($route, $rootScope){
    $route.when('/view1', {templates: {layout: 'horizontal.html', left:'foo.html', right:'bar.html'}});
    $route.when('/view2', {templates: {layout: 'vertical.html', top:'foo.html', bottom:'bar.html'}});
    
    $rootScope.$on('$beforeRouteChange', function(scope, newRoute){
        $rootScope.templates = newRoute.$route.templates;
    });
});