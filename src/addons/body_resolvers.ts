import { ClientPlugin, ResponsePromise } from "../core.ts";

const BODY_METHODS = {
  json: "application/json",
  text: "text/*",
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
} as const;

type BodyMethod = keyof typeof BODY_METHODS;

export type BodyResolvers<JSONType = unknown> = {
  json<T = JSONType>(): Promise<T>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
};

export const bodyResolvers = <JSONType = unknown>(): ClientPlugin<
  unknown,
  unknown,
  BodyResolvers<JSONType>
> =>
(client) => {
  const bodyResolvers = {} as ResponsePromise<unknown, unknown> & {
    [x: string]: any;
  };

  for (const contentType in BODY_METHODS) {
    bodyResolvers[contentType] = async function () {
      this._opts.headers.set("Accept", BODY_METHODS[contentType as BodyMethod]);
      return (await this)[contentType as BodyMethod]();
    };
  }

  return client.withResolvers(bodyResolvers);
};
