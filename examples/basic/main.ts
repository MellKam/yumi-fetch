import * as fetchMock from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

fetchMock.install();
fetchMock.mock("POST@/posts", () => {
  return new Response(
    JSON.stringify({ body: "gdsfsd", id: 3, title: "gsdeffes", userId: 3 }),
    {
      status: 200,
    }
  );
});

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

type CreatePostDTO = {
  title: string;
  body: string;
  userId: number;
};

import wretch from "npm:wretch";

const w = wretch("https://jsonplaceholder.typicode.com/");

Deno.bench("Wretch", async () => {
  const post = await w
    .post(
      {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
      "posts"
    )
    .json<Post>();
});

// @deno-types="../../dist/index.d.ts"
import {
  Yumi,
  defaultDeserializers,
  defaultSerializers,
} from "../../dist/index.js";

const yumi = Yumi({
  baseURL: "https://jsonplaceholder.typicode.com",
  serializers: defaultSerializers,
  deserializers: defaultDeserializers,
});

Deno.bench("Yumi", async () => {
  const post = await yumi
    .fetch("/posts", {
      json: {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
      method: "POST",
    })
    .json<Post>();
});

Deno.bench("fetch", { baseline: true }, async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    body: JSON.stringify({
      title: "foo",
      body: "safasdd",
      userId: 2,
    }),
    method: "POST",
  });

  const post = await res.json();
});
