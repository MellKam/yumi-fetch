import { clientCore } from "../../core.ts";
import { bodyResolvers } from "./body_resolvers.ts";
import * as fetchMock from "mock_fetch";

fetchMock.install();
fetchMock.mock("GET@/user/1", () => {
	return new Response(JSON.stringify(
		{ id: "3", name: "Alex", age: 20 },
	));
});

const client = clientCore.withResolvers(bodyResolvers());

type User = {
	id: string;
	name: string;
	age: number;
};

const user = await client
	.fetch("http://example.com/user/1")
	.json<User>();

console.log(user);
