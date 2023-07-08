import { clientCore } from "../../core.ts";
import { bodyResolvers } from "./body_resolvers.ts";
import * as fetchMock from "mock_fetch";
import { assertSpyCall, assertSpyCalls, spy } from "std/testing/mock.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

fetchMock.install();

type User = {
	id: string;
	name: string;
	age: number;
};

Deno.test("bodyResolvers", async () => {
	const client = clientCore.withResolvers(bodyResolvers());

	const user: User = { id: "3", name: "Alex", age: 20 };
	const res = new Response(JSON.stringify(user));
	fetchMock.mock("GET@/user/1", (req) => {
		assert(req.headers.get("Accept") === "application/json");
		return res;
	});
	const resJsonSpy = spy(res, "json");

	const _user = await client
		.fetch("http://example.com/user/1")
		.json<User>();

	assertSpyCall(resJsonSpy, 0, { returned: Promise.resolve(user) });
	assertSpyCalls(resJsonSpy, 1);
	assertEquals(_user, user);
});
