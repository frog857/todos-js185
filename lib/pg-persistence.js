const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  _partitionTodoLists(todoLists) {
    let done = [];
    let undone = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    })

    return undone.concat(done);
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1 ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(FIND_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodos || !allTodoLists) return undefined;

    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todolist_id;
      });
    });
    
    return this._partitionTodoLists(allTodoLists);
  }

  async sortedTodos(todoList) {
    const SORTED_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 " + 
                         "AND username = $2 ORDER BY done ASC, lower(title) ASC";

    let result = await dbQuery(SORTED_TODOS, todoList.id, this.username);
    let todos = result.rows;

    if (!todos) return undefined;
    return todos;
  }

  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE todolists.id = $1 AND username = $2"
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2";

    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId, this.username);
    let resultTodos = dbQuery(FIND_TODOS, todoListId, this.username);
    let results = await Promise.all([resultTodoList, resultTodos])

    let todoList = results[0].rows[0];

    todoList.todos = results[1].rows;

    if (!todoList) return undefined;
    return todoList;
  }

  async loadTodo(todoListId, todoId) {
    const FIND_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    return result.rows[0];
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }
  
  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_TODOS = "UPDATE todos SET done = NOT done " +
                         "WHERE todolist_id = $1 AND id = $2 AND username = $3"

    let result = await dbQuery(TOGGLE_TODOS, todoListId, todoId, this.username);

    return result.rowCount > 0
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    
    return result.rowCount > 0;
  }

  async markAllDone(todoListId) {
    const MARK_ALL_DONE = "UPDATE todos SET done = true " + 
                          "WHERE todolist_id = $1 AND username = $2 AND NOT done";

    let result = await dbQuery(MARK_ALL_DONE, todoListId, this.username);

    return result.rowCount > 0;
  }

  async createTodo(title, todoListId) {
    const ADD_TODO = "INSERT INTO todos (title, todolist_id, username) " + 
                     "VALUES ($1, $2, $3)";

    let result = await dbQuery(ADD_TODO, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createTodoList(title) {
    const ADD_TODOLIST = "INSERT INTO todolists (title, username) " + 
                         "VALUES ($1, $2)";

    console.log("hello");
    try {
      let result = await dbQuery(ADD_TODOLIST, title, this.username);
      console.log("hello");
      console.log(result.rowCount);
      return result.rowCount > 0;      
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        return false;
      }
    }

    
    
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODO_LIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETE_TODO_LIST, todoListId, this.username);
    
    return result.rowCount > 0;
  }

  async changeTodoListTitle(todoListId, todoListTitle) {
    const CHANGE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";

    let result = await dbQuery(CHANGE_TITLE, todoListTitle, todoListId, this.username);
    return result.rowCount > 0;
  }

  async todoListTitleIsUnique(todoListTitle) {
    const IS_UNIQUE = "SELECT 1 FROM todolists WHERE title = $1 AND username = $2";

    let result = await dbQuery(IS_UNIQUE, todoListTitle, this.username);
    console.log(result.rowCount);
    return result.rowCount === 0;
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" + 
                               " WHERE username = $1";

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }
};
