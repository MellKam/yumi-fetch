import { createResponsePromise, FetchLike, FetchLikeOptions } from "./core.ts";
import { assertSpyCall, assertSpyCalls, spy } from "std/testing/mock.ts";
import { assert, assertInstanceOf } from "std/testing/asserts.ts";

Deno.test("createResponsePromise", async () => {
	const response = new Response("test");
	const fetch = spy<any, Parameters<FetchLike>, ReturnType<FetchLike>>(
		(_url, _opts) => {
			return Promise.resolve(response);
		},
	);
	const url = new URL("https://example.com/api");
	const opts: FetchLikeOptions = { headers: new Headers() };

	{
		const promise = createResponsePromise(fetch, url, opts);
		assert(promise._url === url);
		assert(promise._opts === opts);
		assert(promise._fetch === fetch);
		const res = await promise;

		assert(res === response);
		assertSpyCall(fetch, 0, {
			args: [url, opts],
			self: promise,
			returned: Promise.resolve(response),
		});
		assertSpyCalls(fetch, 1);
	}

	{
		const promise = createResponsePromise(fetch, url, opts);

		assertInstanceOf(promise.then((res) => res), Promise);
	}
});

Deno.test("createResponsePromise #2", async () => {
	const fetch = spy<any, Parameters<FetchLike>, ReturnType<FetchLike>>(
		(_url, _opts) => {
			return Promise.reject(new Error("gsdgsd"));
		},
	);
	const url = new URL("https://example.com/api");
	const opts: FetchLikeOptions = { headers: new Headers() };

	const onFinally = spy();
	const onRejected = spy();
	const onFulfilled = spy();

	const promise = createResponsePromise(fetch, url, opts);

	assert(
		(await promise
			.then(onFulfilled)
			.catch(onRejected)
			.finally(onFinally)) === undefined,
	);

	assertSpyCalls(onFulfilled, 0);
	assertSpyCalls(onRejected, 1);
	assertSpyCalls(onFinally, 1);
});

Deno.test("createResponsePromise #3", async () => {
	const fetch = spy<any, Parameters<FetchLike>, ReturnType<FetchLike>>(
		(_url, _opts) => {
			return Promise.reject(new Error("gsdgsd"));
		},
	);
	const url = new URL("https://example.com/api");
	const opts: FetchLikeOptions = { headers: new Headers() };

	const _onFulfilled = spy<any, any, Promise<Response>>();
	const _onRejected = spy<any, any, Promise<Response>>(() => {
		throw new Error("bcd");
	});
	const _onFinally = spy();
	const onFulfilled = spy();
	const onRejected = spy();
	const onFinally = spy();

	const promise = createResponsePromise(fetch, url, opts);

	assert(
		(await promise
			._then(_onFulfilled)
			._catch(_onRejected)
			._finally(_onFinally)
			.then(onFulfilled)
			.catch(onRejected)
			.finally(onFinally)) === undefined,
	);

	assertSpyCalls(_onFulfilled, 0);
	assertSpyCalls(_onRejected, 1);
	assertSpyCalls(_onFinally, 1);
	assertSpyCalls(onFulfilled, 0);
	assertSpyCalls(onRejected, 1);
	assertSpyCalls(onFinally, 1);
});
