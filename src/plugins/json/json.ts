import { ClientPlugin } from "../../core.ts";

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
 * **Default Yumi Plugin**
 *
 * Client plugin that adds a JSON serializer to your request options and handles JSON serialization for you.
 * It also sets the `Content-Type` header to `application/json` by default, so you don't need to.
 *
 * @template JSONType The accepted type by the `json` option. Default: `unknown`.
 *
 * @example
 * ```ts
 * import { clientCore, json } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(json());
 *
 * await client.fetch("http://example.com/users", {
 *   method: "POST",
 *   json: {
 *     name: "Alex",
 *     age: 20,
 *   },
 * });
 * ```
 */
export const json = <JSONType = unknown>(): ClientPlugin<
  unknown,
  { json: JSONType }
> => {
  return (client) =>
    client.withMiddleware((next) => (url, opts) => {
      if (!opts.body && opts.json) {
        opts.headers.set("Content-Type", "application/json");
        opts.body = JSON.stringify(opts.json);
      }
      return next(url, opts);
    });
};
