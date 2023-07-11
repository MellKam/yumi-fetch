import { createFetchError, FetchError, isHTTPError } from "./http_error.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("createFetchError - with body as JSON", async () => {
	const req = new Request("http://example.com/");
	const res = new Response(JSON.stringify({ foo: "bar" }), {
		status: 500,
		statusText: "Internal Server Error",
		headers: {
			"Content-Type": "application/json",
		},
	});

	const error = await createFetchError(req, res);

	assertEquals(error.body, { foo: "bar" });
	assertEquals(error.status, 500);
	assertEquals(error.url, res.url);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
	assertEquals(
		error.message,
		"500 Internal Server Error (http://example.com/)",
	);
});

Deno.test("createFetchError - without body", async () => {
	const req = new Request("http://example.com/");
	const res = new Response(null, { status: 400, statusText: "Bad Request" });

	const error = await createFetchError(req, res);

	assertEquals(error.body, null);
	assertEquals(error.message, "400 Bad Request (http://example.com/)");
	assertEquals(error.status, 400);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
});

Deno.test("createFetchError - with body as string", async () => {
	const req = new Request("http://example.com/");
	const res = new Response("Bad request", { status: 400 });

	const error = await createFetchError(req, res);

	assertEquals(error.message, "400 (http://example.com/)");
	assertEquals(error.body, "Bad request");
});

Deno.test("createFetchError - with invalid JSON", async () => {
	const req = new Request("http://example.com/");
	const res = new Response("{ abc: undefined }", {
		status: 400,
		statusText: "Bad Request",
		headers: { "Content-Type": "application/json" },
	});

	const error = await createFetchError(req, res);

	assertEquals(error.message, "400 Bad Request (http://example.com/)");
	assertEquals(error.body, "{ abc: undefined }");
});

Deno.test("createFetchError - with statusText message", async () => {
	const req = new Request("http://example.com/");
	const res = new Response(undefined, {
		status: 400,
		statusText: "Bad request",
	});

	const error = await createFetchError(req, res);

	assertEquals(error.message, "400 Bad request (http://example.com/)");
	assertEquals(error.body, null);
});

Deno.test("isHTTPError", () => {
	const req = new Request("http://example.com/");
	const res = new Response(null, { status: 400 });

	const fetchError = new FetchError("Test error", req, res, null);
	const regularError = new Error("Not a HTTPError");

	assert(isHTTPError(fetchError));
	assert(!isHTTPError(regularError));
});

Deno.test("isHTTPError", () => {
	const req = new Request("http://example.com/");
	const res = new Response(null, { status: 400 });

	const fetchError = new FetchError("Test error", req, res, null);
	const regularError = new Error("Not a HTTPError");

	assert(isHTTPError(fetchError));
	assert(!isHTTPError(regularError));
});
