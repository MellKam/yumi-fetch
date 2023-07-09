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
  <a href="https://codecov.io/gh/MellKam/yumi-fetch">
    <img src="https://img.shields.io/codecov/c/gh/MellKam/yumi-fetch?color=FF3797&label=coverage" alt="Code test coverage" />
  </a>
</p>

<p align="center">Extensible and tiny HTTP client, that gives you unlimited control over you requests</p>

# Table of Contents

- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Installation](#installation)
  - [npmjs.com](#npmjscom)
  - [unpkg.com](#unpkgcom)
  - [deno.land](#denoland)
- [Getting started](#getting-started)
- [Bundle size comparison](#bundle-size-comparison)
- [Benchmark comparison](#benchmark-comparison)

# Features

- 🌐 Global options: The client object allows you to set global request options, headers, and a baseURL for all requests.
- 💡 Middlewares: Gain full control over requests and responses using middlewares.
- 💪 Custom client properties: Extend the client with your own custom properties. Add additional functionality or data to enhance the client's capabilities.
- 🔍 Custom response methods: Extend the response object with custom functions.
- 🔌 Powerful plugin system: Benefit from a robust plugin system that offers a wide range of out-of-the-box plugins.
- ✨ Fully type safe: Typescript first package. I fight with typescript, so you dont need to.

# Installation

This package works with various JavaScript runtimes, utilizing the Fetch API available in most modern environments. It supports web browsers, Node.js (v17.5 and above), and older Node.js versions when using a package like [node-fetch](https://github.com/node-fetch/node-fetch). It is also compatible with Deno, Bun, and other runtimes supporting the Fetch API.

## [npmjs.com](https://www.npmjs.com/package/yumi-fetch)

```bash
npm i yumi-fetch
```

## [unpkg.com](https://www.unpkg.com/yumi-fetch)

```html
<script type="module">
import { yumi } from "https://unpkg.com/yumi-fetch/dist/mod.js";
</script>
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

Here you can find a straightforward API that is similar to the `fetch` function but with several notable improvements. You may be familiar with these features from libraries like `axios`, etc.. Firstly, it includes functions named after HTTP methods, such as `.post()` and `.get()`, which make it more intuitive and convenient to perform these actions. Additionally, the API provides simplified serialization capabilities and includes a `.json()` resolver for easy handling of JSON data.

<details>
  <summary>For comparison, here's a code snippet using the plain fetch function</summary>
  
  ```ts
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

  const res = await fetch("https://dummyjson.com/todos?limit=2", 
    { 
      headers: { "Accept": "application/json" } 
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const { todos } = (await res.json()) as Todos;

  console.log(todos);

  const res2 = await fetch("https://dummyjson.com/todos/add", 
    { 
      method: "POST",
      headers: { 
        "Accept": "application/json", 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        todo: "Star Yumi-Fetch repository",
        completed: false,
        userId: 5,
      }) 
    }
  );

  if (!res2.ok) throw new Error(await res.text());
  const createdTodo = (await res2.json()) as Todo;

  console.log(createdTodo);
  ```
</details>

__Imagine a scenario where I told you that all these incredible features can be easily attached to your client as modular plug-ins, allowing you to effortlessly expand its functionality. Well, guess what? It's absolutely true!__

The `yumi` object we imported is essentially a client that has been enhanced with custom modifications on top of it.

```ts
import { clientCore, /* ... */ } from "yumi-fetch";

export const yumi = clientCore
  // adds http methods like .get(), .post(), .put() ...
  .withProperties(httpMethods()) 
  // adds response resolvers .json(), .text(), .formData() ...
  .withResolvers(bodyResolvers())
  // adds query serialization
  .withPlugin(query())
  // adds json serialization
  .withPlugin(json());
```

The beauty of this approach is that all these plug-ins seamlessly modify the client type, making it a breeze to work with TypeScript. By composing these plug-ins together, you can create a powerful and flexible client that meets your specific needs.

# Bundle size comparison

| Package | Base API | Minified size | Minified and gzipped size |
| --- | --- | --- | --- |
| yumi-fetch | fetch | <a href="https://bundlejs.com/?q=yumi-fetch&treeshake=%5B%7Byumi%7D%5D" alt="Minified size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=yumi-fetch&treeshake=[{yumi}]&badge=minified" /></a> | <a href="https://bundlejs.com/?q=yumi-fetch&treeshake=%5B%7Byumi%7D%5D" alt="Minified and gripped size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=yumi-fetch&treeshake=[{yumi}]&badge=" /></a> |
| <a href="https://github.com/elbywan/wretch">wretch</a> | fetch | <a href="https://bundlejs.com/?q=wretch&treeshake=%5B%7Bdefault+as+wretch%7D%5D" alt="Minified size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=wretch&treeshake=[{default+as+wretch}]&badge=minified" /></a> | <a href="https://bundlejs.com/?q=wretch&treeshake=%5B%7Bdefault+as+wretch%7D%5D" alt="Minified and gripped size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=wretch&treeshake=[{default+as+wretch}]&badge=" /></a> |
| <a href="https://github.com/unjs/ofetch">ofetch</a> | fetch | <a href="https://deno.bundlejs.com?q=ofetch&treeshake=[{ofetch}]"><img src="https://deno.bundlejs.com?q=ofetch&treeshake=[{ofetch}]&badge=minified" /></a> | <a href="https://deno.bundlejs.com?q=ofetch&treeshake=[{ofetch}]"><img src="https://deno.bundlejs.com?q=ofetch&treeshake=[{ofetch}]&badge" /></a> |
| <a href="https://github.com/sindresorhus/ky">ky</a> | fetch | <a href="https://bundlejs.com/?q=ky&treeshake=%5B%7Bdefault+as+ky%7D%5D" alt="Minified size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=ky&treeshake=[{default+as+ky}]&badge=minified" /></a> | <a href="https://bundlejs.com/?q=ky&treeshake=%5B%7Bdefault+as+ky%7D%5D" alt="Minified and gripped size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=ky&treeshake=[{default+as+ky}]&badge=" /></a> |
| <a href="https://github.com/axios/axios">axios</a> | XMLHttpRequest | <a href="https://bundlejs.com/?q=axios&treeshake=[{+default+as+axois+}" alt="Minified size badge from bundlejs.com"><img src="https://deno.bundlejs.com?q=axios&treeshake=[{+default+as+axois+}]&badge=minified" /></a> | <a href="https://bundlejs.com/?q=axios&treeshake=[{+default+as+axois+}" alt="Minified and gripped size badge from bundlejs.com"><img src="https://deno.bundlejs.com?q=axios&treeshake=[{+default+as+axois+}]&badge" /></a> |
| <a href="https://github.com/sindresorhus/got">got</a> | XMLHttpRequest | <a href="https://bundlejs.com/?q=got&treeshake=%5B%7Bdefault+as+got%7D%5D" alt="Minified size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=got&treeshake=[{default+as+got}]&badge=minified" /></a> | <a href="https://bundlejs.com/?q=got&treeshake=%5B%7Bdefault+as+got%7D%5D" alt="Minified and gripped size badge from bundlejs.com"><img src="https://deno.bundlejs.com/?q=got&treeshake=[{default+as+got}]&badge=" /></a> |

# Benchmark comparison

```bash
cpu: Apple M1
runtime: deno 1.35.0 (aarch64-apple-darwin)

benchmark       time (avg)             (min … max)       p75       p99      p995
-------------------------------------------------- -----------------------------
fetch           72.39 µs/iter  (60.75 µs … 714.62 µs)  72.46 µs 204.96 µs 307.29 µs
wretch           77.1 µs/iter    (67.92 µs … 1.02 ms)  76.92 µs 109.83 µs 286.46 µs
yumi-fetch      87.31 µs/iter    (75.04 µs … 1.05 ms)  87.08 µs 131.83 µs 277.79 µs
ky             156.34 µs/iter   (121.21 µs … 2.28 ms)  151.5 µs 534.71 µs   1.22 ms
ya-fetch        89.77 µs/iter    (76.38 µs … 1.75 ms)  88.79 µs 144.62 µs 317.83 µs
ofetch          77.51 µs/iter  (68.33 µs … 977.96 µs)   76.5 µs 150.96 µs 197.71 µs

summary
  fetch
   1.07x faster than wretch
   1.07x faster than ofetch
   1.21x faster than yumi-fetch
   1.24x faster than ya-fetch
   2.16x faster than ky
```