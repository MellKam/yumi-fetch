import { ClientPlugin } from "../../core.ts";
import { APP_JSON, CONTENT_TYPE_HEADER } from "../../utils.ts";

export type JSONValue =
	| null
	| string
	| number
	| boolean
	| JSONArray
	| JSONObject;
export type JSONArray = JSONValue[];
export interface JSONObject {
	[x: string]: JSONValue | undefined;
}

/**
 * Client plugin that adds a JSON serializer to your request options and handles JSON serialization for you.
 * It also sets the `Content-Type` header to `application/json` by default, so you don't need to.
 *
 * @template JSONType The accepted type by the `json` option. Default: `unknown`.
 *
 * @example
 * ```ts
 * import { clientCore, jsonSerializer } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(jsonSerializer());
 *
 * await client.fetch("http://example.com/users", {
 *   method: "POST",
 *   json: {
 *     name: "Alex",
 *     age: 20,
 *   },
 * });
 * ```
 *
 * _This plugin is included in the yumi client by default_
 */
export const jsonSerializer = <JSONType = unknown>(): ClientPlugin<
	unknown,
	{ json: JSONType }
> => {
	return (client) =>
		client.withMiddleware((next) => (url, opts) => {
			if (!opts.body && opts.json) {
				opts.headers.set(CONTENT_TYPE_HEADER, APP_JSON);
				opts.body = JSON.stringify(opts.json);
			}
			return next(url, opts);
		});
};
