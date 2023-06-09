import { yumi } from "../../mod.ts";
import { retry } from "./retry.ts";
import * as fetchMock from "mock_fetch";

fetchMock.install();
fetchMock.mock("POST@/todos", () => {
	return new Response("Fuck you", { status: 500 });
});

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

const client = yumi.withPlugin(retry({
	maxAttempts: 8,
	delayTimer: 100,
}));

client.onRetry(({ attemptsMade }) => {
	console.log(`Retry ${attemptsMade}`);
});

const { todos } = await client
	.post("https://dummyjson.com/todos", {
		retry: {
			maxAttempts: 3,
			delayTimer: 200,
		},
	})
	.json<Todos>();

console.log(todos);
