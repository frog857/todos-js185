const SeedData = require('./seed-data');
const deepCopy = require('./deep-copy');
const { sortTodos, sortTodoLists } = require('./sort')

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session._todoLists || deepCopy(SeedData);
    console.log("I've just copied the seed data !");
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
    let todoList = this._todoLists.find(todoList => todoList.id === todoListId);   
    return deepCopy(todoList);
  }

  loadTodo(todoListId, todoId) {
    let todoList = this.loadTodoList(todoListId);
    if (!todoList) return undefined;
    return todoList.todos.find(todo => todo.id === todoId);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }
  
  toggleTodo(todoListId, todoId) {
    this._todoLists.forEach((todoList, todoListIdx) => {
      if (todoList.id === +todoListId) {
        todoList.todos.forEach((todo, todoIdx) => {
          if (todo.id === +todoId) {
            if (todo.done === true) {
              console.log(this._todoLists[todoListIdx].todos[todoIdx]);
              this._todoLists[todoListIdx].todos[todoIdx].done = false;
            } else {
              console.log(this._todoLists[todoListIdx][todoIdx]);
              this._todoLists[todoListIdx].todos[todoIdx].done = true;
            }
          }
        })
      }
    })
  }
};
