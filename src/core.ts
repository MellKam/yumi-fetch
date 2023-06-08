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
export type FetchMiddleware = (
  next: FetchLike,
) => FetchLike;

export type AfterResponseCleaner = () => void;
export type BeforeRequestCallback<
  T_RequestOptions extends Record<string, any> = {},
> = (
  url: URL,
  options:
    & Omit<RequestOptions, "headers">
    & { headers: Headers }
    & Partial<T_RequestOptions>,
) => void | AfterResponseCleaner;

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
  T_RequestOptions extends Record<string, any> = {},
> = {
  baseURL?: string | URL;
  headers?: BetterHeaderInit;
  options?:
    & Omit<RequestOptions, "headers">
    & Partial<T_RequestOptions>;
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
      false
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
 * Represents an object that can perform HTTP requests.
 *
 * @template T_Self - Allows you to extend the client with custom properties
 * @template T_RequestOptions - Allows you to extend request options with custom properties
 * @template T_Resolvers - Allows you to extend the response promise with custom methods, referred to as resolvers
 * @template T_IsPublicOnly - Boolean value indicating whether the client will hide private properties
 */
export interface Client<
  T_Self extends Record<string, any> = {},
  T_RequestOptions extends Record<string, any> = {},
  T_Resolvers extends Resolvers = {},
  T_IsPublicOnly extends boolean = true,
> {
  /**
   * @internal
   * The purpose of this field is to make typescript work with generic inference in intersection types. It will not be initialized on the javascript side, so it will always be `undefined`.
   */
  __T_Self?: T_Self;
  /**
   * This is a small hack for reusing types in and out of the interface. It will not be initialized on the javascript side, so it will always be `undefined`.
   *
   * @example
   * ```ts
   * // This way you can create chainable methods for your addon
   * interface MyAddonModifications {
   *   //@ts-expect-error
   *   myMethod(): NonNullable<this["__T_ReturnThis"]>;
   * }
   * ```
   */
  __T_ReturnThis?: T_IsPublicOnly extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers, true> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _baseURL: URL | undefined;

  _headers: Headers;
  setHeaders(
    init: BetterHeaderInit,
  ): NonNullable<this["__T_ReturnThis"]>;

  _options: Omit<RequestOptions, "headers"> & T_RequestOptions;
  setOptions(
    options: Omit<RequestOptions, "headers"> & T_RequestOptions,
  ): NonNullable<this["__T_ReturnThis"]>;

  _middlewares: FetchMiddleware[];
  addMiddleware(
    middleware: FetchMiddleware,
  ): NonNullable<this["__T_ReturnThis"]>;

  _beforeRequest: BeforeRequestCallback<T_RequestOptions>[];
  beforeRequest(
    callback: BeforeRequestCallback<T_RequestOptions>,
  ): NonNullable<this["__T_ReturnThis"]>;

  _resolvers: T_Resolvers | null;
  addResolvers<
    M_Resolvers extends Resolvers,
  >(
    resolvers: M_Resolvers,
  ): T_IsPublicOnly extends true ? PublicOnly<
      Client<T_Self, T_RequestOptions, T_Resolvers & M_Resolvers, true> & T_Self
    >
    :
      & Client<T_Self, T_RequestOptions, T_Resolvers & M_Resolvers, false>
      & T_Self;

  fetch(
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptions>,
  ): Promise<Response> & T_Resolvers;

  extend(
    options: ExtendOptions,
  ): NonNullable<this["__T_ReturnThis"]>;

  addon<
    M_Self extends Record<string, any> = {},
    M_RequestOptions extends Record<string, any> = {},
    M_Resolvers extends Resolvers = {},
    D_Self extends Record<string, any> = {},
    D_RequestOptions extends Record<string, any> = {},
    D_Resolvers extends Resolvers = {},
  >(
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
  > extends true ? T_IsPublicOnly extends true ? PublicOnly<
        & Client<
          T_Self & M_Self,
          T_RequestOptions & M_RequestOptions,
          T_Resolvers & M_Resolvers,
          true
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
      & M_Self
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

/**
 * The plain object that implements `Client` interface.
 * You don't need to instantiate it to use it, as you do with classes.
 * If you need multiple instances, you can clone it with `extend()` method.
 *
 * #### Why plain object and not class ???
 * There were many attempts to write it in classes, but nothing succeeded. It was especially difficult to satisfy typescript. So it was decided to choose objects instead of classes.
 * In spite of this, in some places we still have to lie to the about types.
 *
 * #### Concept of public and private fields
 * Basically, since we don't use classes, we have to manage our private fields ourselves. In our case, we treat fields starting with `_` (underscore) as private, and any others as public. We can hide private fields from the typescript side using the generic `T_IsPublicOnly`.
 */
export const clientCore: Client = {
  _baseURL: undefined,
  _headers: new Headers(),
  setHeaders(init) {
    new Headers(init)
      .forEach((value, key) => this._headers.set(key, value));
    return this;
  },
  _options: {} as Omit<RequestOptions, "headers">,
  setOptions(options) {
    this._options = { ...this._options, ...options };
    return this;
  },
  _middlewares: [],
  addMiddleware(middleware) {
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
    const url = typeof resource === "string"
      ? new URL(resource, this._baseURL)
      : resource;
    const opts = {
      ...this._options,
      ...options,
      headers: mergeHeaders(this._headers, options.headers),
    };

    const cleaners: AfterResponseCleaner[] = [];
    for (const callback of this._beforeRequest) {
      const cleaner = callback(url, opts);
      if (cleaner) cleaners.push(cleaner);
    }

    const req = new Request(url, opts);

    const _fetch: FetchLike = cleaners.length
      ? (req) =>
        globalThis.fetch(req).finally(() => {
          for (const cleaner of cleaners) cleaner();
        })
      : globalThis.fetch;

    const wrappedFetch = linkMiddlewares(this._middlewares)(_fetch);

    return this._resolvers
      ? {
        ...createResponsePromise(wrappedFetch, req),
        ...this._resolvers,
      }
      : wrappedFetch(req);
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

export type ToPublicClient<T extends Client<any, any, any, false>> = T extends
  Client<infer T_Self, infer T_RequestOptinos, infer T_Resolvers, false>
  ? PublicOnly<Client<T_Self, T_RequestOptinos, T_Resolvers, true>> & T_Self
  : never;

export type ToPrivateClient<T extends PublicOnly<Client<any, any, any, true>>> =
  T extends PublicOnly<
    Client<infer T_Self, infer T_RequestOptinos, infer T_Resolvers, true>
  > ? Client<T_Self, T_RequestOptinos, T_Resolvers, false> & T_Self
    : never;
