import { clientCore } from "../../mod.ts";
import { json } from "./json.ts";
import * as fetchMock from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

fetchMock.install();
fetchMock.mock("POST@/user", () => {
	return new Response(JSON.stringify(
		{ id: "3", name: "Alex", age: 20 },
	));
});

const client = clientCore.withPlugin(json());

await client.fetch("http://example.com/user", {
	method: "POST",
	json: {
		name: "Alex",
		age: 20,
	},
});
