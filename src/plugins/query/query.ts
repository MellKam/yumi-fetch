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
 * import { clientCore, query } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(query());
 *
 * await client.fetch("http://example.com/posts", {
 *   query: {
 *     limit: 10,
 *     offset: 2,
 *   },
 * });
 * ```
 */
export const query =
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
