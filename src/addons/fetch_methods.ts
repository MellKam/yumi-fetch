import { Addon, Client, HTTPMethod, RequestOptions } from "../core.ts";

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
  options?: Exclude<RequestOptions & Partial<T_RequestOptions>, "method">,
) => Promise<Response> & T_Resolvers;

export type FetchMethods = {
  [_ in Lowercase<HTTPMethod>]: FetchMethod;
};

export const fetchMethods: Addon<FetchMethods> = (client) => {
  const methods = {} as FetchMethods;

  for (const method of HTTP_METHODS) {
    methods[method.toLowerCase() as keyof FetchMethods] = function <
      T_RequestOptions,
      T_Resolvers,
    >(
      this: Client<unknown, T_RequestOptions, T_Resolvers>,
      resource: URL | string,
      options = {} as Exclude<
        RequestOptions & Partial<T_RequestOptions>,
        "method"
      >,
    ) {
      (options as RequestInit).method = method;
      return this.fetch(resource, options);
    };
  }

  return { ...client, ...methods };
};
