import { ClientPlugin } from "../../core.ts";

export type QueryParams = {
	[k: string]:
		| string
		| number
		| boolean
		| readonly (string | number | boolean)[]
		| undefined;
};

/**
 * **Default Yumi Plugin**
 *
 * Client plugin that adds a query serializer to your request options and handles query serialization for you.
 *
 * @template QueryType The accepted type by the `query` option. Default: `QueryParams`.
 *
 * @example
 * ```ts
 * import { clientCore, querySerializer } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(querySerializer());
 *
 * await client.fetch("http://example.com/posts", {
 *   query: {
 *     limit: 10,
 *     offset: 2,
 *   },
 * });
 * ```
 *
 * _This plugin is included in the yumi client by default_
 */
export const querySerializer =
	<QueryType = QueryParams>(): ClientPlugin<unknown, { query: QueryType }> =>
	(
		client,
	) => {
		return client.withMiddleware((next) => (url, opts) => {
			if (opts.query) {
				for (const key in opts.query) {
					const value = opts.query[key];
					if (value) url.searchParams.set(key, value.toString());
				}
			}
			return next(url, opts);
		});
	};
