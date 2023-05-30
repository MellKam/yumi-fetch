import { Addon, Client, HTTPMethod } from "../core.ts";

const HTTP_METHODS: readonly Lowercase<HTTPMethod>[] = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;

export interface HTTPMethodsSelf
  extends Record<Lowercase<HTTPMethod>, unknown> {
  get(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  post(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    // @ts-expect-error
  ): ReturnType<this["fetch"]>;
  put(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  patch(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  delete(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  head(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  options(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
  trace(
    this: Client<HTTPMethodsSelf> & HTTPMethodsSelf,
    resource: URL | string,
    /** @ts-expect-error */
    options?: Parameters<this["fetch"]>[1],
    /** @ts-expect-error */
  ): ReturnType<this["fetch"]>;
}

const createMethods = () => {
  const methods = {} as HTTPMethodsSelf;

  for (const method of HTTP_METHODS) {
    methods[method] = function (
      resource: URL | string,
      options: Parameters<typeof this["fetch"]>[1] = {},
    ) {
      (options as RequestInit).method = method;
      return this.fetch(resource, options);
    };
  }

  return methods;
};

export const httpMethodsAddon: Addon<HTTPMethodsSelf> = (client) => {
  return { ...client, ...createMethods() };
};