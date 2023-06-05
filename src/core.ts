export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "CONNECT"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE";

/**
 * Represents a set of the most frequently used HTTP headers.
 */
export type CommonHeader =
  | "Accept"
  | "Accept-Charset"
  | "Accept-Encoding"
  | "Accept-Language"
  | "Authorization"
  | "Cache-Control"
  | "Content-Disposition"
  | "Content-Encoding"
  | "Content-Length"
  | "Content-Type"
  | "Cookie"
  | "Date"
  | "ETag"
  | "Expires"
  | "Host"
  | "If-Modified-Since"
  | "If-None-Match"
  | "Last-Modified"
  | "Location"
  | "Origin"
  | "Referer"
  | "Server"
  | "Set-Cookie"
  | "User-Agent"
  | "WWW-Authenticate";

/**
 * Represents an improved, better-typed alternative to the `HeaderInit` type for providing headers in a request.
 *
 * This type offers better developer experience by providing more precise typing options for header initialization.
 */
export type BetterHeaderInit =
  | Headers
  | Record<CommonHeader, string>
  | Record<string, string>
  | [CommonHeader, string][]
  | [string, string][];

export type RequestOptions =
  & RequestInit
  & {
    headers?: BetterHeaderInit;
    method?: HTTPMethod;
  };

export type FetchLike = (req: Request) => Promise<Response>;
export type FetchMiddleware = (next: FetchLike) => FetchLike;

export type BeforeRequestCallback<
  T_RequestOptions extends Record<string, any> = {},
> = (
  url: URL,
  options:
    & Omit<RequestOptions, "headers">
    & { headers: Headers }
    & Partial<T_RequestOptions>,
) => void;

export type ResponsePromise =
  & Promise<Response>
  & { _req: Request };

/**
 * A function that will be attached to `ResponsePromise` and will have the capability to execute a fetch promise while modifying the original request.
 *
 * Note: Cannot be an arrow function, as context would be lost.
 *
 * @example
 * ```ts
 * function () {
 *   this._req.headers.set("Accept", "application/json");
 *   return (await this).json();
 * }
 * ```
 */
export type Resolver = (
  this: ResponsePromise,
  ...args: unknown[]
) => Promise<unknown>;
export type Resolvers = Record<string, Resolver>;

const createResponsePromise = (
  fetcher: FetchLike,
  req: Request,
): ResponsePromise => {
  return {
    _req: req,
    then(onfulfilled, onrejected) {
      return fetcher(this._req).then(onfulfilled, onrejected);
    },
    catch(onrejected) {
      return fetcher(this._req).then(null, onrejected);
    },
    finally(onfinally) {
      return fetcher(this._req).finally(onfinally);
    },
    [Symbol.toStringTag]: "Promise",
  };
};

export type ExtendOptions<
  T_RequestOptinos extends Record<string, any> = {},
> = {
  baseURL?: string | URL;
  headers?: BetterHeaderInit;
  options?: Omit<RequestOptions, "headers"> & T_RequestOptinos;
};

/**
 * Represents a type of addon (in other words, plugin) that extends the client type with custom generics.
 *
 * ### Addon modifications
 * An addon modification is a set of generics that the addon uses to modify the client's generics.
 *
 * @template M_Self (Self modifications) - The object of properties, that addon will add to the client `Self` generic.
 * @template M_RequestOptions (Request options modifications) - Options that addon will add to the client `RequestOptions` generic.
 * @template M_Resolvers (Resolvers modifications) - Resolvers that addon will add to the client `Resolvers` generic.
 *
 * ### Addon dependencies
 * An addon dependency is a set of generics that the addon requires from the client to be included.
 *
 * @template D_Self (Self dependencies) - Dependencies on client `Self` generic.
 * @template D_RequestOptions (Request options dependencies) - Dependencies on client `RequestOptions` generic.
 * @template D_Resolvers (Resolvers dependecies) - Dependencies on client `Resolvers` generic.
 */
export type Addon<
  M_Self extends Record<string, any> = {},
  M_RequestOptions extends Record<string, any> = {},
  M_Resolvers extends Resolvers = {},
  D_Self extends Record<string, any> = {},
  D_RequestOptions extends Record<string, any> = {},
  D_Resolvers extends Resolvers = {},
> = <
  C_Self extends D_Self,
  C_RequestOptinos extends D_RequestOptions,
  C_Resolvers extends D_Resolvers,
>(
  client:
    & Client<
      C_Self & M_Self,
      C_RequestOptinos & M_RequestOptions,
      C_Resolvers & M_Resolvers,
      false // "false" => because addon must always have access to the client's private properties
    >
    & C_Self,
) =>
  & Client<
    C_Self & M_Self,
    C_RequestOptinos & M_RequestOptions,
    C_Resolvers & M_Resolvers,
    false
  >
  & C_Self
  & M_Self;

/**
 * Excludes all properties starting with `_` (underscores) from the object.
 *
 * Since there is no concept of private and public fields in JS objects, we accept the convention that all properties starting with `_` are private and all others are public.
 *
 * @example
 * ```ts
 * type T = PublicOnly<{ foo: string, _bar: number }>;
 * // now T = { foo: string }
 * ```
 */
export type PublicOnly<T> = {
  [K in keyof T as Exclude<K, `_${string}`>]: T[K];
};

type IsExtends<A, B> = A extends B ? true : false;

/**
 * Are all elements of the array `T` equal to an element of `U`
 *
 * @example
 * ```ts
 * IsAllEquals<[false, false], false>
 * // true
 * IsAllEquals<[false, true], false>
 * // false
 * ```
 */
type AllEquals<T extends boolean[], U extends boolean> = T extends [] ? true
  : T extends [infer First extends boolean, ...infer Rest extends boolean[]]
    ? U extends First ? AllEquals<Rest, U> : false
  : never;

/**
 * @template T_Self - Allows you to extend the client with custom properties
 * @template T_RequestOptinos - Allows you to extend request options with custom properties
 * @template T_Resolvers - Allows you to extend response promise with custom methods (resolvers)
 * @template T_Public - Boolean that represends "will the client hide all private properties"
 */
export interface Client<
  T_Self extends Record<string, any> = {},
  T_RequestOptions extends Record<string, any> = {},
  T_Resolvers extends Resolvers = {},
  T_Public extends boolean = false,
> {
  _baseURL: URL | undefined;

  _headers: Headers;
  setHeaders(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    init: BetterHeaderInit,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _options: Omit<RequestOptions, "headers"> & T_RequestOptions;
  setOptions(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    options: Omit<RequestOptions, "headers"> & T_RequestOptions,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _middlewares: FetchMiddleware[];
  useMiddleware(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    middleware: FetchMiddleware,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _beforeRequest: BeforeRequestCallback<T_RequestOptions>[];
  beforeRequest(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    callback: BeforeRequestCallback<T_RequestOptions>,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _resolvers: T_Resolvers | null;
  addResolvers<
    M_Resolvers extends Resolvers,
  >(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    resolvers: M_Resolvers,
  ): T_Public extends true ? PublicOnly<
      & Client<
        T_Self,
        T_RequestOptions,
        T_Resolvers & M_Resolvers,
        true
      >
      & T_Self
    >
    :
      & Client<
        T_Self,
        T_RequestOptions,
        T_Resolvers & M_Resolvers,
        false
      >
      & T_Self;

  fetch(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptions>,
  ): Promise<Response> & T_Resolvers;

  extend(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    options: ExtendOptions<T_RequestOptions>,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  addon<
    M_Self extends Record<string, any> = {},
    M_RequestOptions extends Record<string, any> = {},
    M_Resolvers extends Resolvers = {},
    D_Self extends Record<string, any> = {},
    D_RequestOptions extends Record<string, any> = {},
    D_Resolvers extends Resolvers = {},
  >(
    this: T_Public extends true
      ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
      : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self,
    addon: Addon<
      M_Self,
      M_RequestOptions,
      M_Resolvers,
      D_Self,
      D_RequestOptions,
      D_Resolvers
    >,
  ): AllEquals<
    [
      IsExtends<T_Self, D_Self>,
      IsExtends<T_RequestOptions, D_RequestOptions>,
      IsExtends<T_Resolvers, D_Resolvers>,
    ],
    true
  > extends true ? (T_Public extends true ? PublicOnly<
        & Client<
          T_Self & M_Self,
          T_RequestOptions & M_RequestOptions,
          T_Resolvers & M_Resolvers
        >
        & T_Self
        & M_Self
      >
      :
        & Client<
          T_Self & M_Self,
          T_RequestOptions & M_RequestOptions,
          T_Resolvers & M_Resolvers,
          false
        >
        & T_Self
        & M_Self)
    : never;
}

const linkMiddlewares =
  (middlewares: FetchMiddleware[]) => (fetch: FetchLike): FetchLike => {
    if (!middlewares.length) return fetch;
    return middlewares.reduceRight((next, mw) => mw(next), fetch);
  };

const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
  const result = new Headers(h1);
  if (h2) {
    new Headers(h2)
      .forEach((value, key) => result.set(key, value));
  }

  return result;
};

const mergeURLs = (
  clientURL?: URL,
  extendURL?: URL | string,
): URL | undefined => {
  if (extendURL) {
    if (!clientURL) return new URL(extendURL);

    return typeof extendURL === "string"
      ? new URL(extendURL, clientURL)
      : new URL(extendURL);
  }

  return clientURL ? new URL(clientURL) : undefined;
};

export const clientCore: Client = {
  _baseURL: undefined,
  _headers: new Headers(),
  setHeaders(init) {
    new Headers(init)
      .forEach((value, key) => this._headers.set(key, value));
    return this;
  },
  _options: {} as RequestOptions,
  setOptions(options) {
    this._options = { ...this._options, ...options };
    return this;
  },
  _middlewares: [],
  useMiddleware(middleware) {
    this._middlewares.push(middleware);
    return this;
  },
  _beforeRequest: [] as BeforeRequestCallback[],
  beforeRequest(callback) {
    this._beforeRequest.push(callback);
    return this;
  },
  _resolvers: null,
  addResolvers(resolvers) {
    this._resolvers = { ...this._resolvers, ...resolvers };
    return this as any;
  },
  fetch(resource, options = {}) {
    const url = new URL(resource, this._baseURL);
    const headers = mergeHeaders(this._headers, options.headers);

    const opts = { ...this._options, ...options, headers };

    for (const callback of this._beforeRequest) {
      callback(url, opts);
    }

    const req = new Request(url, opts);
    const wrappedFetch = linkMiddlewares(this._middlewares)(globalThis.fetch);

    if (!this._resolvers) {
      return wrappedFetch(req);
    }

    return {
      ...createResponsePromise(wrappedFetch, req),
      ...this._resolvers,
    };
  },
  addon(addon) {
    return addon(this as any);
  },
  extend(options) {
    return {
      ...this,
      _baseURL: mergeURLs(this._baseURL, options.baseURL),
      _headers: mergeHeaders(this._headers, options.headers),
      _options: { ...this._options, ...options.options },
    };
  },
};

export type ToPublic<T extends Client<any, any, any, false>> = T extends
  Client<infer T_Self, infer T_RequestOptinos, infer T_Resolvers, false>
  ? PublicOnly<Client<T_Self, T_RequestOptinos, T_Resolvers, true>> & T_Self
  : never;

export type ToPrivate<T extends PublicOnly<Client<any, any, any, true>>> =
  T extends PublicOnly<
    Client<infer T_Self, infer T_RequestOptinos, infer T_Resolvers, true>
  > ? Client<T_Self, T_RequestOptinos, T_Resolvers, false>
    : never;
