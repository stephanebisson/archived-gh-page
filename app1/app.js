function AppController($route) {
    $route.parent(this);
    $route.when('/foo', {template: 'foo.html', controller: FooController});
}

function FooController() {
    this.msg = 'FOO';
}