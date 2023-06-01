import { Addon, Client, HTTPMethod } from "../core.ts";

const HTTP_METHODS: readonly HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "TRACE",
  "CONNECT",
] as const;

export interface HTTPFetchMethods
  extends Record<Lowercase<HTTPMethod>, unknown> {
  get(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  post(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  put(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  patch(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  delete(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  head(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  options(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  trace(
    this: Client<HTTPFetchMethods> & HTTPFetchMethods,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Omit<Parameters<this["fetch"]>[1], "method">,
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
}

const createMethods = () => {
  const methods = {} as HTTPFetchMethods;

  for (const method of HTTP_METHODS) {
    methods[method.toLowerCase() as keyof HTTPFetchMethods] = function (
      resource: URL | string,
      /** @ts-ignore */
      options: Omit<Parameters<this["fetch"]>[1], "method"> = {},
    ) {
      (options as RequestInit).method = method.toUpperCase();
      return this.fetch(resource, options);
    };
  }

  return methods;
};

export const httpMethodsAddon: Addon<HTTPFetchMethods> = (client) => {
  return { ...client, ...createMethods() };
};
