import { AnyAsyncFunc, Client, clientCore, RequestOptions } from "./core.ts";

export { bodyMethodsAddon } from "./addons/body_methods.ts";
export { httpMethodsAddon } from "./addons/http_methods.ts";
export { queryAddon } from "./addons/query.ts";

export type ClientOptions = {
  baseURL?: string | URL;
  headers?: HeadersInit;
  options?: Exclude<RequestOptions, "headers">;
};

export const createClient = <
  T_RequestOptinos extends Record<string, any> = {},
  T_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
>(
  options: ClientOptions = {},
): Client<{}, T_RequestOptinos, T_ResponseMethods> => {
  const client = {
    ...clientCore,
    _url: typeof options.baseURL === "string"
      ? new URL(options.baseURL)
      : options.baseURL,
  };

  if (options.headers) {
    client.headers(options.headers);
  }

  return client as Client<{}, T_RequestOptinos, T_ResponseMethods>;
};
