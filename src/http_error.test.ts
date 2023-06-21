import { HTTPError, isHTTPError } from "./http_error.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("HTTPError - create with json value", async () => {
	const res = new Response(JSON.stringify({ foo: "bar" }), { status: 500 });
	const error = await HTTPError.create(res);

	assertEquals(error.json, { foo: "bar" });
	assertEquals(error.text, JSON.stringify({ foo: "bar" }));
	assert(error.status === 500);
	assertEquals(error.response, res);
});

Deno.test("HTTPError - create with text", async () => {
	const res = new Response("Bad request", { status: 400 });
	const error = await HTTPError.create(res);

	assert(typeof error.json === "undefined");
	assertEquals(error.text, "Bad request");
	assert(error.status === 400);
	assertEquals(error.response, res);
});

Deno.test("HTTPError - without body", async () => {
	const res = new Response(null, { status: 400 });
	const error = await HTTPError.create(res);

	assert(typeof error.json === "undefined");
	assert(typeof error.text === "undefined");
	assert(error.status === 400);
	assertEquals(error.response, res);
});

Deno.test("isHTTPError with HTTPError", async () => {
	assert(
		isHTTPError(await HTTPError.create(new Response(null, { status: 400 }))),
	);
	assert(isHTTPError(new Error("Not a HTTPError")) === false);
});
