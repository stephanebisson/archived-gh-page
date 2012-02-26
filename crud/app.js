var app = angular.module('app', []);

app.factory('tasks', ['$resource', function($resource){
    return $resource('tasks.txt');
}]);

function AppController($route){
    $route.parent(this);
    $route.when('/tasks', {template: 'task/list.html', controller:TaskListController});
    $route.when('/tasks/:id', {template: 'task/show.html', controller:TaskShowController});
    $route.when('/tasks/:id/edit', {template: 'task/edit.html', controller:TaskEditController});
}

function TaskListController(tasks){
    this.tasks = tasks.query();
}

function TaskShowController(tasks, $routeParams){
    this.task = tasks.get($routeParams.id);
    console.log(tasks);
    console.log(this.task);
}

function TaskEditController() {
    this.taskTypes = [
        {id:1, type:'code'}, 
        {id:2, type:'planning'}, 
        {id:3, type:'documentation'}];
        
    this.task = {
        id:1, 
        name:'feature 1', 
        desc:'the description of all the tasks required to implement feature 1',
        email: 'name@mail.com',
        type: this.taskTypes[0],
        dueDate: '12-31-2012'
    };
    
    this.verify = function(){
        console.log('verify:', this.task.dueDate);
    };
    
    
}

angular.inputType('tigerDate', ['$element', function(inputElement){
    var widget = this;
    
    widget.$on('$validate', function(event){
        var value = widget.$viewValue,
            valid = value.match('[0-9]{2}-[0-9]{2}-[0-9]{4}');
        widget.$emit(valid ? "$valid" : "$invalid", "Date format");
    });
}]);





