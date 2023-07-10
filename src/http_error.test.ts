import { createFetchError, isHTTPError } from "./http_error.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("FetchError", async () => {
	const req = new Request("http://example.com");
	const res = new Response(JSON.stringify({ foo: "bar" }), {
		status: 500,
		headers: {
			"Content-Type": "application/json",
		},
	});
	const error = await createFetchError(req, res);

	assertEquals(error.body, { foo: "bar" });
	assert(error.status === 500);
	assert(error.url === res.url);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
});

Deno.test("FetchError - without body", async () => {
	const req = new Request("http://example.com");
	const res = new Response(null, { status: 400 });
	const error = await createFetchError(req, res);

	assert(error.body === null);
	assert(error.message === "Unknown error");
	assert(error.status === 400);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
});

Deno.test("FetchError - with body as string", async () => {
	const req = new Request("http://example.com");
	const res = new Response("Bad request", { status: 400 });
	const error = await createFetchError(req, res);

	assert(error.message === "Bad request");
	assert(error.body === "Bad request");
});

Deno.test("FetchError - with invalid json", async () => {
	const req = new Request("http://example.com");
	const res = new Response("{ abc: undefined }", {
		status: 400,
		headers: { "Content-Type": "application/json" },
	});
	const error = await createFetchError(req, res);

	assert(error.message === "{ abc: undefined }");
	assert(error.body === "{ abc: undefined }");
});

Deno.test("FetchError - with statusText message", async () => {
	const req = new Request("http://example.com");
	const res = new Response(undefined, {
		status: 400,
		statusText: "Bad request",
	});
	const error = await createFetchError(req, res);

	assert(error.message === "Bad request");
	assert(error.body === null);
});

Deno.test("isHTTPError", async () => {
	const req = new Request("http://example.com");
	const res = new Response(null, { status: 400 });

	assert(isHTTPError(await createFetchError(req, res)));
	assert(isHTTPError(new Error("Not a HTTPError")) === false);
});
