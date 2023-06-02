import { Addon } from "../core.ts";

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
  <JSONType = unknown>(): Addon<{}, { json: JSONType }> => (client) => {
    return client.beforeRequest((_, opts) => {
      if (!opts.body && opts.json) {
        opts.headers.set("Content-Type", "application/json");
        opts.body = JSON.stringify(opts.json);
      }
    });
  };
