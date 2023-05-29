import { Addon, ResponseMethod } from "../core.ts";

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

const BODY_METHODS = {
  json: "application/json",
  text: "text/*",
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
} as const;

type BodyMethod = keyof typeof BODY_METHODS;

type BodyMethods = {
  json<T extends JSONValue>(): Promise<T>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
};

const createBodyMethods = () => {
  const bodyMethods = {} as Record<string, ResponseMethod>;

  for (const contentType in BODY_METHODS) {
    bodyMethods[contentType] = async function () {
      this._req.headers.set("Accept", BODY_METHODS[contentType as BodyMethod]);
      return this._fetch(this._req).then((res) =>
        res[contentType as BodyMethod]()
      );
    };
  }

  return bodyMethods;
};

export const bodyMethodsAddon: Addon<
  {},
  { json: JSONValue },
  BodyMethods
> = (client) => {
  return {
    ...client.beforeRequest((_, opts) => {
      if (!opts.body && opts.json) {
        opts.headers.set("Content-Type", BODY_METHODS.json);
        opts.body = JSON.stringify(opts.json);
      }
    }).responseMethods(createBodyMethods()),
  };
};
