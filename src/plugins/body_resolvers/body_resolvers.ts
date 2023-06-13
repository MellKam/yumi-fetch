import { ClientPlugin, ResponsePromise } from "../../core.ts";

const BODY_RESOLVERS = {
  json: "application/json",
  text: "text/*",
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
} as const;

type BodyResolver = keyof typeof BODY_RESOLVERS;

export type BodyResolvers<JSONType = unknown> = {
  json<T extends JSONType = JSONType>(): Promise<T>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
};

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
export const bodyResolvers = <JSONType = unknown>(): ClientPlugin<
  unknown,
  unknown,
  BodyResolvers<JSONType>
> => {
  return (client) => {
    const bodyResolvers = {} as
      & ResponsePromise<unknown, BodyResolvers<JSONType>>
      & BodyResolvers<JSONType>;

    for (const resolver in BODY_RESOLVERS) {
      bodyResolvers[resolver as BodyResolver] = async function () {
        this._opts.headers.set(
          "Accept",
          BODY_RESOLVERS[resolver as BodyResolver],
        );
        return (await this)[resolver as BodyResolver]();
      };
    }

    return client.withResolvers(bodyResolvers);
  };
};
