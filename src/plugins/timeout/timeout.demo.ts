import { yumi } from "../../mod.ts";
import { timeout } from "./timeout.ts";
// import * as fetchMock from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

// fetchMock.install();
// fetchMock.mock("POST@/todos", async () => {
//   await new Promise((res) => setTimeout(res, 1000));
//   return new Response("Fuck you", { status: 500 });
// });

type Todo = {
	id: number;
	todo: string;
	completed: boolean;
	userId: number;
};

type Todos = {
	todos: Todo[];
	total: number;
	skip: number;
	limit: number;
};

const client = yumi.withPlugin(timeout(100));

client
	.post("https://dummyjson.com/todos", {
		timeout: 200,
	})
	.onTimeout((url, opts, err) => {
		console.log(url, opts, err);
	})
	.json<Todos>();
