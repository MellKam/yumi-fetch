import { Client, ResponsePromise } from "../../core.ts";

type HTTPFetchMethod = <T_RequestOptions, T_Resolvers>(
	this: Client<unknown, T_RequestOptions, T_Resolvers>,
	resource: URL | string,
	options?: Omit<RequestInit, "method"> & Partial<T_RequestOptions>,
) => ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;

export type HTTPMethods<HTTPMethod extends string> = {
	[_ in Lowercase<HTTPMethod>]: HTTPFetchMethod;
};

export type DefaultMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * This function creates shorthand methods for making fetch calls with specific HTTP methods.
 *
 * @example
 * ```ts
 * import { clientCore, httpMethods } from "yumi-fetch";
 *
 * const client = clientCore.withProperties(httpMethods());
 *
 * // BEFORE 😕
 * client.fetch("/todos", { method: "POST" })
 * // AFTER 😃
 * client.post("/todos")
 * ```
 *
 * By default it provides limited set of http methods `GET`, `POST`, `PUT`, `PATCH`, `DELETE` but you can also provide your own set as the array of strings.
 *
 * @example
 * ```ts
 * const client = clientCore.withProperties(
 * 	 httpMethods(['GET', 'POST', 'PUT', 'OPTIONS', 'HEAD', 'TRACE'])
 * )
 *
 * client.options("/api/user")
 * client.head("/api/user")
 * client.trace("/api/user")
 * ```
 *
 * _This methods are included in the yumi client by default_
 */
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
