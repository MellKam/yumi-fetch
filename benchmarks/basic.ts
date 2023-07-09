import * as fetchMock from "mock_fetch";

fetchMock.install();
fetchMock.mock("POST@/posts", async (req) => {
	if (req.headers.get("hello") !== "world") {
		throw new Error("Headers miss");
	}
	if (req.method !== "POST") {
		throw new Error("Method miss");
	}
	if (req.headers.get("Content-type") !== "application/json") {
		throw new Error(`Invalid content type ${req.headers.get("Content-type")}`);
	}
	const data = await req.json();
	if (data["title"] !== "foo") {
		throw new Error("invalid data");
	}

	if (new URL(req.url).pathname !== "/posts") {
		throw new Error(`invalid pathname ${new URL(req.url).pathname}`);
	}
	return new Response(
		JSON.stringify({ body: "gdsfsd", id: 3, title: "gsdeffes", userId: 3 })
	);
});

type Post = {
	id: number;
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
		headers: { hello: "world", "content-type": "application/json" },
	});

	const post = await res.json();
});

// --------- Wretch ---------
import Wretch from "npm:wretch";

Deno.bench("wretch", async () => {
	const wretch = Wretch("https://jsonplaceholder.typicode.com/", {
		headers: { hello: "world" },
	});

	const post = await wretch
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

// --------- Yumi ---------

import { yumi } from "../src/mod.ts";

Deno.bench("yumi-fetch", async () => {
	const client = yumi
		.withBaseURL("https://jsonplaceholder.typicode.com/")
		.withHeaders({ hello: "world" });

	const post = await client
		.post("/posts", {
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
		headers: { hello: "world" },
	});

	const post = await ky
		.post("posts", {
			json: {
				title: "foo",
				body: "safasdd",
				userId: 2,
			},
			searchParams: {
				abc: 8,
				dbc: "gsdgasd",
			},
		})
		.json<Post>();
});

// --------- YA ---------

import { create } from "npm:ya-fetch";

Deno.bench("ya-fetch", async () => {
	const ya = create({
		base: "https://jsonplaceholder.typicode.com/",
		headers: { hello: "world" },
	});

	const post = await ya
		.post("posts", {
			json: {
				title: "foo",
				body: "safasdd",
				userId: 2,
			},
		})
		.json<Post>();
});

// --------- ofetch ---------

import { createFetch } from "npm:ofetch";

Deno.bench("ofetch", async () => {
	const apiFetch = createFetch({
		fetch: fetch,
		Headers: Headers,
	}).create({
		baseURL: "https://jsonplaceholder.typicode.com",
		headers: { hello: "world" },
	});

	const post = await apiFetch<Post>("/posts", {
		body: {
			title: "foo",
			body: "safasdd",
			userId: 2,
		},
		method: "POST",
	});
});
