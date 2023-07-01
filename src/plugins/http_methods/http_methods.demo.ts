import { clientCore } from "../../core.ts";
import { httpMethods } from "./http_methods.ts";
import * as fetchMock from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

fetchMock.install();
fetchMock.mock("GET@/user/1", () => {
	return new Response(JSON.stringify(
		{ id: "3", name: "Alex", age: 20 },
	));
});

const client = clientCore.withProperties(httpMethods());

type User = {
	id: string;
	name: string;
	age: number;
};

const res = await client
	.get("http://example.com/user/1");

const user = (await res.json()) as User;

console.log(user);
