<p align="center">
    <img src="https://svgshare.com/i/tf_.svg" align="center" width="420px">
</p>

A package that tries to improve your `fetch` experience without creating new
abstractions or significantly increasing bundle size. Has a powerful plugin
system that gives you complete control and amazing flexibility.

## API example (not final)`

```ts
import yumi from "yumi-fetch";

const client = yumi.extend({
  baseURL: "http://localhost:3000/api/",
});

type User = { ... };

const user = client.get("/users", { 
    query: { id: 3 } 
  })
  .json<User>();

const createdUser = client.post("/user", {
    json: { name: "Alexs", age: "21" }
  })
  .json<User>();
```

In active development...
