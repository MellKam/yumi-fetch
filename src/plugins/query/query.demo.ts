import { clientCore } from "../../mod.ts";
import { querySerializer } from "./query.ts";
import * as fetchMock from "mock_fetch";

fetchMock.install();
fetchMock.mock("POST@/user", () => {
	return new Response(JSON.stringify(
		{ id: "3", name: "Alex", age: 20 },
	));
});

const client = clientCore.withPlugin(querySerializer());

await client.fetch("http://example.com/user", {
	method: "POST",
	query: {
		limit: 10,
		offset: 2,
	},
});
