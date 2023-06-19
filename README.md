<p align="center">
    <img src="https://svgshare.com/i/tf_.svg" align="center" width="420px">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/yumi-fetch">
    <img alt="npm" src="https://img.shields.io/npm/v/yumi-fetch?color=FF3797&label=npm">
  </a>
  <a href="https://deno.land/x/yumi">
    <img alt="deno.land" src="https://img.shields.io/github/v/tag/MellKam/yumi-fetch?color=FF3797&label=deno.land%2Fx&logo=deno">
  </a>
  <a href="https://github.com/MellKam/yumi-fetch/blob/main/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/MellKam/yumi-fetch?color=FF3797">
  </a>
  <a href="https://github.com/MellKam/soundify/commits/main">
    <img src="https://img.shields.io/github/last-commit/MellKam/yumi-fetch?color=FF3797" alt="Last commit" />
  </a>
  <a href="https://bundlejs.com/?q=yumi-fetch&treeshake=%5B%7B+yumi+%7D%5D">
    <img src="https://deno.bundlejs.com/?q=yumi-fetch&treeshake=[{+yumi+}]&badge=minified&color=FF3797" alt="Size of yumi client">
  </a>
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
import { yumi } from "https://deno.land/x/yumi/mod.ts";
```

# Getting started

```ts
import { yumi } from "yumi-fetch";

const client = yumi.withBaseURL("https://dummyjson.com/");

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
  .get("/todos", { query: { limit: 2 } })
  .json<Todos>();

console.log(todos);

const createdTodo = await client
  .post("/todos/add", {
    json: {
      todo: "Star Yumi-Fetch repository",
      completed: false,
      userId: 5,
    },
  })
  .json<Todo>();

console.log(createdTodo);
```

Here you can see very simple api that is simmilar to fetch but with global instance as axios.

# Inspiration

Yumi was inspired by many other http client packages. I tried to take the best parts from each of them, and I want to mention a few that helped me a lot. [Wretch](https://github.com/elbywan/wretch), [Ky](https://github.com/sindresorhus/ky), [Ya-fetch](https://github.com/exah/ya-fetch), and even a bit [Axios](https://github.com/axios/axios), even though it doesn't use the fetch API.
