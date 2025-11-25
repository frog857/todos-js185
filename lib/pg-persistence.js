const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {

  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let result = await dbQuery(ALL_TODOLISTS);
    let todoLists = result.rows;

    for (let i = 0; i < todoLists.length; i++) {
      let todoList = todoLists[i];
      let result = await dbQuery(FIND_TODOS, todoList.id);
      todoList.todos = result.rows;
    }
    return this._partitionTodoLists(todoLists);
  }

  async sortedTodos(todoList) {
    const SORTED_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done ASC, lower(title) ASC";

    let result = await dbQuery(SORTED_TODOS, todoList.id);
    let todos = result.rows;

    if (!todos) return undefined;
    return todos;
  }

  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE todolists.id = $1"
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId);
    let resultTodos = dbQuery(FIND_TODOS, todoListId);
    let results = await Promise.all([resultTodoList, resultTodos])

    let todoList = results[0].rows[0];

    todoList.todos = results[1].rows;

    if (!todoList) return undefined;
    return todoList;
  }

  async loadTodo(todoListId, todoId) {
    const FIND_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(FIND_TODO, todoListId, todoId);
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
                         "WHERE todolist_id = $1 AND id = $2"

    let result = await dbQuery(TOGGLE_TODOS, todoListId, todoId);

    return result.rowCount > 0
  }

  async deleteTodo(todoListId, todoId) {
    const CONFIRM_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2";
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2"

    let result = await dbQuery(DELETE_TODO, todoListId, todoId);
    
    return result.rowCount > 0;
  }

  async markAllDone(todoListId) {
    const MARK_ALL_DONE = "UPDATE todos SET done = true " + 
                          "WHERE todolist_id = $1 AND NOT done";

    let result = await dbQuery(MARK_ALL_DONE, todoListId);

    return result.rowCount > 0;
  }

  async createTodo(title, todoListId) {
    const ADD_TODO = "INSERT INTO todos (title, todolist_id) " + 
                     "VALUES ($1, $2)";

    let result = await dbQuery(ADD_TODO, title, todoListId);
    return result.rowCount > 0;
  }

  async createTodoList(title) {
    const ADD_TODOLIST = "INSERT INTO todolists (title) " + 
                         "VALUES ($1)";

    let result = await dbQuery(ADD_TODOLIST, title);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODO_LIST = "DELETE FROM todolists WHERE id = $1";
    let result = await dbQuery(DELETE_TODO_LIST, todoListId);
    
    return result.rowCount > 0;
  }

  async changeTodoListTitle(todoListId, todoListTitle) {
    const CHANGE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2";

    let result = await dbQuery(CHANGE_TITLE, todoListTitle, todoListId);
    return result.rowCount > 0;
  }

  async todoListTitleIsUnique(todoListTitle) {
    const IS_UNIQUE = "SELECT * FROM todolists WHERE title = $1";

    let result = await dbQuery(IS_UNIQUE, todoListTitle);
    console.log(result.rowCount);
    return result.rowCount === 0;
  }
};
