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

## [npmjs.com](https://www.npmjs.com/package/yumi-fetch)

```bash
npm i yumi-fetch
```

## [unpkg.com](https://www.unpkg.com/yumi-fetch)

```html
<script type="module">
import { ... } from "https://unpkg.com/yumi-fetch/dist/mod.js";
</script>
```

## [deno.land](https://deno.land/x/yumi)

```ts
import { ... } from "https://deno.land/x/yumi/mod.ts";
```

# Getting started

```ts
import { createClient, FetchError } from "yumi-fetch";
import { z, ZodError } from "zod";

const client = createClient({
	baseUrl: "https://dummyjson.com",
});

const todoSchema = z.object({
	id: z.number(),
	todo: z.string(),
	completed: z.boolean(),
	userId: z.number(),
});

const todosSchema = z.object({
	todos: z.array(todoSchema),
	total: z.number(),
	skip: z.number(),
	limit: z.number(),
});

try {
	const data = await client.fetch("/todos", {
		query: { limit: 3 },
		parseAs: "json",
	});

	const todos = todosSchema.parse(data);
	console.log(todos);
} catch (error) {
	if (error instanceof FetchError) {
    // handle fetch error
		console.error(error);
	} else if (error instanceof ZodError) {
    // handle validation error
		console.error(...error.format()._errors);
	} else {
		console.error("Some tricky error:", error);
	}
}
```

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
cpu: AMD Ryzen 5 2600 Six-Core Processor
runtime: deno 1.36.3 (x86_64-unknown-linux-gnu)

benchmark              time (avg)        iter/s             (min … max)       p75       p99      p995
----------------------------------------------------------------------- -----------------------------
fetch                 187.96 µs/iter       5,320.2   (153.26 µs … 1.16 ms) 189.61 µs 392.14 µs 718.29 µs
wretch                195.78 µs/iter       5,107.7    (172.36 µs … 1.9 ms) 192.85 µs 425.55 µs 735.96 µs
yumi-fetch (beta)     223.35 µs/iter       4,477.2   (192.52 µs … 2.52 ms) 216.04 µs 358.35 µs   1.21 ms
ky                    539.36 µs/iter       1,854.0   (436.39 µs … 2.89 ms) 547.88 µs 951.98 µs   2.56 ms
ya-fetch              272.85 µs/iter       3,665.0   (224.03 µs … 3.83 ms) 270.14 µs  546.3 µs  768.3 µs
ofetch                203.97 µs/iter       4,902.8    (181.02 µs … 3.3 ms) 199.03 µs 301.79 µs 362.33 µs
yumi-fetch (v1)       187.41 µs/iter       5,335.8   (170.22 µs … 1.29 ms) 183.05 µs 279.73 µs 300.53 µs

summary
  fetch
   1x slower than yumi-fetch (v1)
   1.04x faster than wretch
   1.09x faster than ofetch
   1.19x faster than yumi-fetch (beta)
   1.45x faster than ya-fetch
   2.87x faster than ky
```