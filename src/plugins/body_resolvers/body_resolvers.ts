import { ResponsePromise } from "../../core.ts";

export type BodyResolvers<JSONType = unknown> = {
  json<T extends JSONType = JSONType>(this: ResponsePromise): Promise<T>;
  text(this: ResponsePromise): Promise<string>;
  arrayBuffer(this: ResponsePromise): Promise<ArrayBuffer>;
  blob(this: ResponsePromise): Promise<Blob>;
  formData(this: ResponsePromise): Promise<FormData>;
};

const BODY_RESOLVERS = {
  json: "application/json",
  text: "text/*",
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
} as Record<keyof BodyResolvers, string>;

/**
 * **Default Yumi Plugin**
 *
 * Clinet plugin that provides default body resolvers (`json`, `text`, `arrayBuffer`, `blob`, `formData`) to the client instance.
 *
 * @template JSONType The base type for JSON values that the `.json()` method will return by default and extend the passed types. Default: `unknown`
 *
 * @example
 * ```ts
 * import { clientCore, bodyResolvers } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(bodyResolvers());
 *
 * type User = { ... };
 * const user = await client
 *   .fetch("http://example.com/user/1")
 *   .json<User>();
 * ```
 */
export const bodyResolvers = <JSONType = unknown>() => {
  const resolvers = {} as BodyResolvers<JSONType>;

  for (const resolver in BODY_RESOLVERS) {
    resolvers[resolver as keyof BodyResolvers<JSONType>] = async function (
      this: ResponsePromise
    ) {
      this._opts.headers.set(
        "Accept",
        BODY_RESOLVERS[resolver as keyof BodyResolvers]
      );
      return (await this)[resolver as keyof BodyResolvers]();
    };
  }

  return resolvers;
};
