<p align="center">
    <img src="https://svgshare.com/i/tf_.svg" align="center" width="420px">
</p>

Package that enhances your `fetch` experience and aims to be as similar to Fetch
API as it can be. It has a powerful plugin system that gives you complete
control and incredible flexibility.

# Installation

## [NPM](https://www.npmjs.com/package/yumi-fetch)

```bash
npm i yumi-fetch
```

## [deno.land](https://deno.land/x/yumi)

```ts
import yumi from "https://deno.land/x/yumi/mod.ts";
```

# Getting started

```ts
import { yumi } from "yumi-fetch";

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

const { todos } = await yumi
  .get("https://dummyjson.com/todos", { query: { limit: 2 } })
  .json<Todos>();

console.log(todos);

const createdTodo = await yumi
  .post("https://dummyjson.com/todos/add", {
    json: {
      todo: "Star Yumi-Fetch repository",
      completed: false,
      userId: 5,
    },
  })
  .json<Todo>();

console.log(createdTodo);
```
