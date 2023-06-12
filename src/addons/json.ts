import { ClientPlugin } from "../core.ts";

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

export const jsonSerializer =
  <JSONType = unknown>(): ClientPlugin<unknown, { json: JSONType }> =>
  (client) =>
    client.withMiddleware((next) => (url, opts) => {
      if (!opts.body && opts.json) {
        opts.headers.set("Content-Type", "application/json");
        opts.body = JSON.stringify(opts.json);
      }
      return next(url, opts);
    });
