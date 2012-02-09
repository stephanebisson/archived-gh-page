function AppController($route){
    $route.parent(this);
    $route.when('/tasks', {template: 'task/list.html', controller:TaskListController});
}

function TaskListController($resource){
    var tasks = $resource('tasks.txt');
    console.log(tasks);
    this.tasks = tasks.query();
}
