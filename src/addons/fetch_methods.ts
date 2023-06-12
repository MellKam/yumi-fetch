import {
  BetterRequestInit,
  Client,
  ClientPlugin,
  ResponsePromise,
} from "../core.ts";

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

type FetchMethod = <
  T_RequestOptions,
  T_Resolvers,
>(
  this: Client<unknown, T_RequestOptions, T_Resolvers>,
  resource: URL | string,
  options?: Omit<BetterRequestInit<T_RequestOptions>, "method">,
) => ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;

export type FetchMethods = {
  [_ in Lowercase<HTTPMethod>]: FetchMethod;
};

export const fetchMethods: ClientPlugin<FetchMethods> = (client) => {
  const methods = {} as FetchMethods;

  for (const method of HTTP_METHODS) {
    methods[method.toLowerCase() as keyof FetchMethods] = function <
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

  return { ...client, ...methods };
};
