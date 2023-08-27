import { createClient, FetchError, ExtractParams } from "yumi-fetch";
import { z, ZodError } from "zod";

const client = createClient({
	baseUrl: "https://dummyjson.com",
});

const todoSchema = z.object({
	id: z.number(),
	todo: z.string(),
	completed: z.boolean(),
	userId: z.number(),
});

const todosSchema = z.object({
	todos: z.array(todoSchema),
	total: z.number(),
	skip: z.number(),
	limit: z.number(),
});

try {
	const data = await client.fetch("/todos", {
		query: { limit: 3 },
		parseAs: "json",
	});

	const todos = todosSchema.parse(data);
	console.log(todos);
} catch (error) {
	if (error instanceof FetchError) {
		console.error(error);
	} else if (error instanceof ZodError) {
		console.error(...error.format()._errors);
	} else {
		console.error("Some tricky error:", error);
	}
}

const getTodo = async (options: ExtractParams<"/todos/{id}">) => {
	const data = await client.fetch("/todos/{id}", {
		params: options,
		parseAs: "json",
	});

	return todoSchema.parse(data);
};

try {
	const todo = await getTodo({ id: 2 });
	console.log(todo);
} catch (error) {
	if (error instanceof FetchError) {
		console.error(error);
	} else if (error instanceof ZodError) {
		console.error(...error.format()._errors);
	} else {
		console.error("Some tricky error:", error);
	}
}
