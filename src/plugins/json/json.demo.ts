import { clientCore } from "../../mod.ts";
import { jsonSerializer } from "./json.ts";
import * as fetchMock from "mock_fetch";

fetchMock.install();
fetchMock.mock("POST@/user", () => {
	return new Response(JSON.stringify(
		{ id: "3", name: "Alex", age: 20 },
	));
});

const client = clientCore.withPlugin(jsonSerializer());

await client.fetch("http://example.com/user", {
	method: "POST",
	json: {
		name: "Alex",
		age: 20,
	},
});
