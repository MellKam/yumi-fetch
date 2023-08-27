import { createResource, ErrorBoundary, For, Show } from "solid-js";
import { createClient } from "yumi-fetch";

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

const client = createClient({
	baseUrl: "https://dummyjson.com",
});

const getTodos = async () => {
	return (await client.fetch("/todos", {
		query: { limit: 10 },
		parseAs: "json",
	})) as Todos;
};

export const App = () => {
	const [todos] = createResource(getTodos);

	return (
		<ul>
			<ErrorBoundary fallback={(err) => <div>{String(err)}</div>}>
				<Show when={todos()} fallback={<div>Loading...</div>}>
					{(todos) => (
						<For each={todos().todos}>
							{(todo) => (
								<li>
									{todo.id} [{todo.completed ? "COMPLETED" : "IN PROCESS"}]{" "}
									{todo.todo}{" "}
								</li>
							)}
						</For>
					)}
				</Show>
			</ErrorBoundary>
		</ul>
	);
};
