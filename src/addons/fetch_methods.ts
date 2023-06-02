import { Addon, HTTPMethod } from "../core.ts";

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

export interface FetchMethods extends Record<Lowercase<HTTPMethod>, unknown> {
  get(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  post(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  put(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  patch(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  delete(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  head(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  options(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  trace(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  connect(
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
}

export const fetchMethods: Addon<FetchMethods> = (client) => {
  const methods = {} as FetchMethods;

  for (const method of HTTP_METHODS) {
    methods[method.toLowerCase() as keyof FetchMethods] = function (
      resource: URL | string,
      /** @ts-expect-error */
      options: Omit<Parameters<this["fetch"]>[1], "method"> = {},
    ) {
      (options as RequestInit).method = method.toUpperCase();
      /** @ts-expect-error */
      return this.fetch(resource, options);
    };
  }

  return { ...client, ...methods };
};
