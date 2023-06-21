import { Client, ResponsePromise } from "../../core.ts";

type HTTPFetchMethod = <T_RequestOptions, T_Resolvers>(
	this: Client<unknown, T_RequestOptions, T_Resolvers>,
	resource: URL | string,
	options?: Omit<RequestInit, "method"> & Partial<T_RequestOptions>,
) => ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;

export type HTTPMethods<HTTPMethod extends string> = {
	[_ in Lowercase<HTTPMethod>]: HTTPFetchMethod;
};

/**
 * **Default Yumi Plugin**
 *
 * Clinet plugin providing shorthand for fetch calls with certain http methods.
 *
 * @example
 * ```ts
 * import { clientCore, httpMethods } from "yumi-fetch";
 *
 * const client = clientCore.withProperties(httpMethods());
 *
 * // without this plugin
 * client.fetch("/todos", { method: "POST" })
 * // with this plugin
 * client.post("/todos")
 * ```
 */

export type DefaultMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export const httpMethods = <const T extends string = DefaultMethods>(
	methodNames: readonly T[] = [
		"GET" as T,
		"POST" as T,
		"PUT" as T,
		"PATCH" as T,
		"DELETE" as T,
	],
) => {
	const methods = {} as HTTPMethods<T>;

	for (const method of methodNames) {
		methods[method.toLowerCase() as Lowercase<T>] = function <
			T_RequestOptions,
			T_Resolvers,
		>(
			this: Client<unknown, T_RequestOptions, T_Resolvers>,
			resource: URL | string,
			options = {},
		) {
			(options as RequestInit).method = method;
			return this.fetch(resource, options);
		};
	}

	return methods;
};
