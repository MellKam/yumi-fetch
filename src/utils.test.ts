import {
	AllBooelanEquals,
	IsExtends,
	mergeHeaders,
	mergeURLs,
} from "./utils.ts";
import { assert, assertThrows } from "std/testing/asserts.ts";
import type { AssertFalse, AssertTrue } from "conditional_type_checks";

Deno.test("mergeURLs - url and base as string", () => {
	assert(
		mergeURLs("/user", "http://example.com/api/").toString() ===
			"http://example.com/api/user",
	);
	assert(
		mergeURLs("user", "http://example.com/api").toString() ===
			"http://example.com/api/user",
	);
	assert(
		mergeURLs("/user", "http://example.com/api").toString() ===
			"http://example.com/api/user",
	);
	assert(
		mergeURLs("user", "http://example.com/api/").toString() ===
			"http://example.com/api/user",
	);

	assert(
		mergeURLs("/user", "http://example.com/api?a=3#abc").toString() ===
			"http://example.com/api/user?a=3#abc",
	);
});

Deno.test("mergeURLs - base as URL", () => {
	assert(
		mergeURLs("/user", new URL("http://example.com/api/")).toString() ===
			"http://example.com/api/user",
	);
	assert(
		mergeURLs("/user", new URL("http://example.com/api?a=3#abc")).toString() ===
			"http://example.com/api/user?a=3#abc",
	);
});

Deno.test("mergeURLs - url and base as URL", () => {
	assert(
		mergeURLs(
			new URL("http://example.com/api/user"),
			new URL("http://example.com/api/"),
		).toString() === "http://example.com/api/user",
	);
});

Deno.test("mergeURLs - without base", () => {
	assert(
		mergeURLs(new URL("http://example.com/api/user")).toString() ===
			"http://example.com/api/user",
	);
	assert(
		mergeURLs("http://example.com/api/user").toString() ===
			"http://example.com/api/user",
	);
	assertThrows(() => mergeURLs("/api/url"));
});

const headersEqual = (h1: HeadersInit, h2: HeadersInit) => {
	const _h1 = new Headers(h1);
	const _h2 = new Headers(h2);

	for (const [key, value] of _h1.entries()) {
		if (_h2.get(key) !== value) return false;
	}

	return true;
};

Deno.test("mergeHeaders - merge two headers", () => {
	assert(
		headersEqual(
			mergeHeaders(
				{ "Content-Type": "application/json" },
				{ Authorization: "Bearer token" },
			),
			{
				"Content-Type": "application/json",
				Authorization: "Bearer token",
			},
		),
	);

	const headers = new Headers({ "Content-Type": "application/json" });
	const mergedHeaders = mergeHeaders(headers);

	assert(headersEqual(mergedHeaders, headers));
	assert(mergedHeaders !== headers);
});

Deno.test("AllEquals", () => {
	type _test =
		| AssertTrue<AllBooelanEquals<[true, true, true], true>>
		| AssertTrue<AllBooelanEquals<[false, false, false], false>>
		| AssertFalse<AllBooelanEquals<[false, true, false], false>>
		| AssertFalse<AllBooelanEquals<[false, false, false], true>>;
});

Deno.test("IsExtends", () => {
	type _test =
		| AssertTrue<IsExtends<true, true>>
		| AssertFalse<IsExtends<false, true>>
		| AssertTrue<IsExtends<{ a: number }, { a: number }>>
		| AssertFalse<IsExtends<{ a: number }, { a: number; b: string }>>;
});
