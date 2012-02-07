function AppController($route) {
    $route.parent(this);
    $route.when('/foo', {template: 'foo.html', controller: FooController});
    $route.when('/bar', {template: 'bar.html', controller: BarController});
}

function FooController() {
    var MAX = 5000;
    this.data = [];
    for (var i = 0; i < MAX; i++) {
        this.data.push({
            name1: 'value1',
            name2: 'value2',
            name3: 'value3',
            name4: 'value4',
            name5: 'value5',
            name6: 'value6',
            name7: 'value7',
            name8: 'value8',
            name9: 'value9',
            name10: 'value10'
        });
    }
    this.msg = 'FOO';
}

function BarController() {
    
}