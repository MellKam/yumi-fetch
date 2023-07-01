import { ResponsePromise } from "../../core.ts";

export type BodyResolvers<JSONType = unknown> = {
	json<T extends JSONType = JSONType>(this: ResponsePromise): Promise<T>;
	text(this: ResponsePromise): Promise<string>;
	arrayBuffer(this: ResponsePromise): Promise<ArrayBuffer>;
	blob(this: ResponsePromise): Promise<Blob>;
	formData(this: ResponsePromise): Promise<FormData>;
};

type BodyResolverName = keyof BodyResolvers;

const BODY_RESOLVERS: Record<BodyResolverName, string> = {
	json: "application/json",
	text: "text/*",
	arrayBuffer: "*/*",
	blob: "*/*",
	formData: "multipart/form-data",
};

/**
 * Response resolvers that operate on default body deserialize methods (`json`, `text`, `arrayBuffer`, `blob`, `formData`).
 *
 * @template JSONType The base type for JSON values that the `.json()` method will return by default and extend the passed types. Default: `unknown`
 *
 * @example
 * ```ts
 * import { clientCore, bodyResolvers } from "yumi-fetch";
 *
 * const client = clientCore.withResolvers(bodyResolvers());
 *
 * type User = { ... };
 * const user = await client
 *   .fetch("http://example.com/user/1")
 *   .json<User>();
 * ```
 *
 * _These resolvers are included in the yumi client by default_
 */
export const bodyResolvers = <JSONType = unknown>() => {
	const resolvers = {} as BodyResolvers<JSONType>;

	for (const resolverName in BODY_RESOLVERS) {
		resolvers[resolverName as BodyResolverName] = async function (
			this: ResponsePromise,
		) {
			this._opts.headers.set(
				"Accept",
				BODY_RESOLVERS[resolverName as BodyResolverName],
			);
			return (await this)[resolverName as BodyResolverName]();
		};
	}

	return resolvers;
};
