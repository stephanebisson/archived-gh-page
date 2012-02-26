var app = angular.module('app', []);

app.run(function($route, $rootScope){
    $route.when('/one', {templates: {layout: 'horizontal.html', left:'blue.html', right:'red.html'}});
    $route.when('/two', {templates: {layout: 'vertical.html', top:'blue.html', bottom:'red.html'}});
    
    $rootScope.$on('$beforeRouteChange', function(scope, newRoute){
        $rootScope.templates = newRoute.$route.templates;
    });
});