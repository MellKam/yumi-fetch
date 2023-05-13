import * as fetchMock from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

fetchMock.install();
fetchMock.mock("POST@/posts", () => {
  return new Response(
    JSON.stringify({ body: "gdsfsd", id: 3, title: "gsdeffes", userId: 3 }),
    {
      status: 200,
    },
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

// --------- Fetch ---------

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

// --------- Wretch ---------
import WRETCH from "npm:wretch";

Deno.bench("Wretch", async () => {
  const wretch = WRETCH("https://jsonplaceholder.typicode.com/", {
    headers: { "hello": "world" },
  });

  const post = await wretch
    .post(
      {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
      "posts",
    )
    .json<Post>();
});

// --------- Yumi ---------

import YUMI from "../src/index.ts";

Deno.bench("Yumi", async () => {
  const yumi = YUMI.extend({
    baseURL: "https://jsonplaceholder.typicode.com/",
    fetch: fetchMock.mockedFetch,
    headers: { "hello": "world" },
  });

  const post = await yumi
    .post("posts", {
      json: {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
    })
    .json<Post>();
});

// --------- KY ---------

import KY from "npm:ky";

Deno.bench("ky", async () => {
  const ky = KY.extend({
    prefixUrl: "https://jsonplaceholder.typicode.com/",
    headers: { "hello": "world" },
  });

  const post = await ky.post("posts", {
    json: {
      title: "foo",
      body: "safasdd",
      userId: 2,
    },
  }).json<Post>();
});

// --------- GOT ---------

import GOT from "npm:got";

Deno.bench("Got", async () => {
  const got = GOT.extend({
    prefixUrl: "https://jsonplaceholder.typicode.com/",
    headers: { "hello": "world" },
  });

  const post = await got
    .post("posts", {
      json: {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
    }).json<Post>();
});

// --------- YA ---------

import { create } from "npm:ya-fetch";

Deno.bench("Ya", async () => {
  const ya = create({
    base: "https://jsonplaceholder.typicode.com/",
    headers: { "hello": "world" },
  });

  const post = await ya
    .post("posts", {
      json: {
        title: "foo",
        body: "safasdd",
        userId: 2,
      },
    }).json<Post>();
});
