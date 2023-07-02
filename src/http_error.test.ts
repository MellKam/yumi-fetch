import { isHTTPError, YumiError } from "./http_error.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("YumiError", async () => {
	const req = new Request("http://example.com");
	const res = new Response(JSON.stringify({ foo: "bar" }), { status: 500 });
	const error = await YumiError.create(req, res);

	assertEquals(error.body, { foo: "bar" });
	assert(error.status === 500);
	assert(error.url === res.url);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
});

Deno.test("YumiError - without body", async () => {
	const req = new Request("http://example.com");
	const res = new Response(null, { status: 400 });
	const error = await YumiError.create(req, res);

	assert(typeof error.body === "undefined");
	assert(error.status === 400);
	assertEquals(error.request, req);
	assertEquals(error.response, res);
});

Deno.test("isHTTPError", async () => {
	const req = new Request("http://example.com");
	const res = new Response(null, { status: 400 });

	assert(isHTTPError(await YumiError.create(req, res)));
	assert(isHTTPError(new Error("Not a HTTPError")) === false);
});
