import client from "../../src/mod.ts";

type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};

type Todos = {
  todos: Todo[];
  total: number;
  skip: number;
  limit: number;
};

const { todos } = await client
  .get("https://dummyjson.com/todos", { query: { limit: 2 } })
  .json<Todos>();

console.log(todos);

const createdTodo = await client
  .post("https://dummyjson.com/todos/add", {
    json: {
      todo: "Star Yumi-Fetch repository",
      completed: false,
      userId: 5,
    },
  })
  .json<Todo>();

console.log(createdTodo);
