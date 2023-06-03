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
  & { _req: Request }
  & Record<string, unknown>;

export type Resolver = (
  this: ResponsePromise,
  ...args: unknown[]
) => Promise<unknown>;
export type Resolvers = Record<string, Resolver>;

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

export interface Client<
  T_Self extends Record<string, any> = {},
  T_RequestOptions extends Record<string, any> = {},
  T_Resolvers extends Resolvers = {},
  T_Public extends boolean = true,
> {
  _baseURL: URL | undefined;

  _headers: Headers;
  setHeaders(
    init: BetterHeaderInit,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _options: Omit<RequestOptions, "headers"> & T_RequestOptions;
  setOptions(
    options: Omit<RequestOptions, "headers"> & T_RequestOptions,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _middlewares: FetchMiddleware[];
  useMiddleware(
    middleware: FetchMiddleware,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _beforeRequestCallbacks: BeforeRequestCallback<T_RequestOptions>[];
  beforeRequest(
    callback: BeforeRequestCallback<T_RequestOptions>,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  _resolvers: T_Resolvers | null;
  addResolvers<
    M_Resolvers extends Resolvers,
  >(
    this:
      & Client<
        T_Self,
        T_RequestOptions,
        T_Resolvers & M_Resolvers,
        false
      >
      & T_Self,
    resolvers: M_Resolvers,
  ): T_Public extends true ? PublicOnly<
      & Client<
        T_Self,
        T_RequestOptions,
        T_Resolvers & M_Resolvers
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
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptions>,
  ): Promise<Response> & T_Resolvers;

  extend(
    options: ExtendOptions<T_RequestOptions>,
  ): T_Public extends true
    ? PublicOnly<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>
    : Client<T_Self, T_RequestOptions, T_Resolvers, false> & T_Self;

  addon<
    A_Self extends Record<string, any> = {},
    A_RequestOptions extends Record<string, any> = {},
    A_Resolvers extends Resolvers = {},
    X_Self extends Record<string, any> = {},
    X_RequestOptions extends Record<string, any> = {},
    X_Resolvers extends Resolvers = {},
  >(
    addon: Addon<
      A_Self,
      A_RequestOptions,
      A_Resolvers,
      X_Self,
      X_RequestOptions,
      X_Resolvers
    >,
  ): (
    (T_Self extends X_Self
      ? T_RequestOptions extends X_RequestOptions
        ? T_Resolvers extends X_Resolvers ? true : false
      : false
      : false)
  ) extends true ? (T_Public extends true ? PublicOnly<
        & Client<
          T_Self & A_Self,
          T_RequestOptions & A_RequestOptions,
          T_Resolvers & A_Resolvers
        >
        & T_Self
        & A_Self
      >
      :
        & Client<
          T_Self & A_Self,
          T_RequestOptions & A_RequestOptions,
          T_Resolvers & A_Resolvers,
          false
        >
        & T_Self
        & A_Self)
    : never;
}

const linkMiddlewares =
  (middlewares: FetchMiddleware[]) => (fetch: FetchLike): FetchLike => {
    if (!middlewares.length) return fetch;
    return middlewares.reduceRight((next, mw) => mw(next), fetch);
  };

const createResponsePromise = (fetch: FetchLike, req: Request) => {
  const promise: ResponsePromise & { _fetch: FetchLike } = {
    _fetch: fetch,
    _req: req,
    then(onfulfilled, onrejected) {
      return this._fetch(this._req).then(onfulfilled, onrejected);
    },
    catch(onrejected) {
      return this._fetch(this._req).then(null, onrejected);
    },
    finally(onfinally) {
      return this._fetch(this._req).finally(onfinally);
    },
    [Symbol.toStringTag]: "Promise",
  };

  return promise as ResponsePromise;
};

const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
  const result = new Headers(h1);
  if (h2) {
    new Headers(h2)
      .forEach((value, key) => result.set(key, value));
  }

  return result;
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
  _beforeRequestCallbacks: [] as BeforeRequestCallback[],
  beforeRequest(callback) {
    this._beforeRequestCallbacks.push(callback);
    return this;
  },
  _resolvers: null,
  addResolvers(resolvers) {
    this._resolvers = { ...this._resolvers, ...resolvers };
    return this;
  },
  fetch(resource, options = {}) {
    const url = new URL(resource, this._baseURL);
    const headers = mergeHeaders(this._headers, options.headers);

    const opts = { ...this._options, ...options, headers };

    for (const callback of this._beforeRequestCallbacks) {
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
      _baseURL: options.baseURL ? new URL(options.baseURL) : undefined,
      _headers: mergeHeaders(this._headers, options.headers),
      _options: { ...this._options, ...options.options },
    };
  },
};
