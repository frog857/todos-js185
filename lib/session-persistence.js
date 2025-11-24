const SeedData = require('./seed-data');
const deepCopy = require('./deep-copy');
const { sortTodos, sortTodoLists } = require('./sort');
const nextId = require('./next-id');

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }


  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter(todo => !todo.done);
    let done = todos.filter(todo => todo.done);
    return deepCopy(sortTodos(undone, done));
  }  

  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    return deepCopy(todoList);
  }

  loadTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }
  
  toggleDoneTodo(todoListId, todoId) {
    // load the todo
    // if it doesn't exist, return false
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) return false;

    // otherwise, toggle it
    // return true
    todo.done = !todo.done;
    return true;
  }

  _findTodo(todoListId, todoId) {
    // get the right todo list
    // if there isn't a todolist, return undefined
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;

    // return the todo from the todoList using the todoId
    return todoList.todos.find(todo => todoId === todo.id);
  }

  _findTodoList(todoListId) {
    // search the session store todoLists using the todo 
    // if it doesn't exist return undefined
    return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId, todoId);
    if (!todoList) return false;
    
    let indexToDelete = todoList.todos.findIndex(todo => todoId === todo.id);
    if (indexToDelete === -1) return false;

    todoList.todos.splice(indexToDelete, 1);
    return true;
  }

  markAllDone(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.forEach(todo => todo.done = true);
    return true;
  }

  createTodo(title, todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.push({
      id: nextId(),
      title,
      done: false,
    })
    return true;
  }

  createTodoList(title) {
    this._todoLists.push({
      id: nextId(),
      title,
      todos: [],
    });

    return true;
  }

  deleteTodoList(todoListId) {
    let indexToDelete = this._todoLists.findIndex(todoList => todoList.id === todoListId);
    if (indexToDelete === -1) return false;

    this._todoLists.splice(indexToDelete, 1);
    return true;
  }

  changeTodoListTitle(todoListId, todoListTitle) {
    let indexToChange = this._todoLists.findIndex(todoList => todoList.id === todoListId);
    if (indexToChange === -1) return false;

    this._todoLists[indexToChange].title = todoListTitle;
    return true;
  }

  todoListTitleIsUnique(todoListTitle) {
    let isUnique = this._todoLists.every(todoList => todoList.title !== todoListTitle);
    return isUnique;
  }


};
