import {
  BetterRequestInit,
  Client,
  ClientPlugin,
  ResponsePromise,
} from "../../core.ts";

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

const HTTP_METHODS: readonly HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

type HTTPFetchMethod = <
  T_RequestOptions,
  T_Resolvers,
>(
  this: Client<unknown, T_RequestOptions, T_Resolvers>,
  resource: URL | string,
  options?: Omit<BetterRequestInit<T_RequestOptions>, "method">,
) => ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;

export type HTTPMethods = {
  [_ in Lowercase<HTTPMethod>]: HTTPFetchMethod;
};

/**
 * **Default Yumi Plugin**
 *
 * Clinet plugin providing shorthand for fetch calls with certain http methods.
 *
 * @example
 * ```ts
 * import { clientCore, httpMethods } from "yumi-fetch";
 *
 * const client = clientCore.withPlugin(httpMethods);
 *
 * // without this plugin
 * client.fetch("/todos", { method: "POST" })
 * // with this plugin
 * client.post("/todos")
 * ```
 */
export const httpMethods: ClientPlugin<HTTPMethods> = (client) => {
  const methods = {} as HTTPMethods;

  for (const method of HTTP_METHODS) {
    methods[method.toLowerCase() as Lowercase<HTTPMethod>] = function <
      T_RequestOptions,
      T_Resolvers,
    >(
      this: Client<unknown, T_RequestOptions, T_Resolvers>,
      resource: URL | string,
      options = {},
    ) {
      (options as RequestInit).method = method;
      return this.fetch(resource, options);
    };
  }

  return client.withProperties(methods);
};
