export type PublicOnly<T> = {
  [K in keyof T as Exclude<K, `_${string}`>]: T[K];
};

/**
 * Represents common HTTP methods used in web requests.
 */
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
export type BetterHeadersInit =
  | Headers
  | Record<CommonHeader, string>
  | Record<string, string>
  | [CommonHeader, string][]
  | [string, string][];

export type RequestOptions =
  & Omit<RequestInit, "method" | "headers">
  & {
    headers?: BetterHeadersInit;
    method?: HTTPMethod;
  };

export type FetchLike = (req: Request) => Promise<Response>;
export type FetchMiddleware = (next: FetchLike) => FetchLike;

export type BeforeRequest<
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
  & { _fetch: FetchLike; _req: Request }
  & Record<string, any>;

export type Resolver = (
  this: ResponsePromise,
  ...args: unknown[]
) => Promise<unknown>;

export type Resolvers = Record<string, Resolver>;

/**
 * Represents an addon(plugin) type that extends a client with additional functionality and properties.
 */
export type Addon<
  A_Self extends Record<string, any> = {},
  A_RequestOptions extends Record<string, any> = {},
  A_Resolvers extends Resolvers = {},
  X_Self extends Record<string, any> = {},
  X_RequestOptions extends Record<string, any> = {},
  X_Resolvers extends Resolvers = {},
> = <
  C_Self extends X_Self,
  C_RequestOptinos extends X_RequestOptions,
  C_Resolvers extends X_Resolvers,
>(
  client:
    & Client<
      C_Self & A_Self,
      C_RequestOptinos & A_RequestOptions,
      C_Resolvers & A_Resolvers,
      false
    >
    & C_Self,
) =>
  & Client<
    C_Self & A_Self,
    C_RequestOptinos & A_RequestOptions,
    C_Resolvers & A_Resolvers,
    false
  >
  & C_Self
  & A_Self;

export type ClientOptions<
  T_RequestOptinos extends Record<string, any> = {},
> = {
  baseURL?: string | URL;
  headers?: BetterHeadersInit;
  options?: Omit<RequestOptions, "headers"> & T_RequestOptinos;
  middlewares?: FetchMiddleware[];
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
    init: BetterHeadersInit,
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

  _beforeRequestCallbacks: BeforeRequest<T_RequestOptions>[];
  beforeRequest(
    callback: BeforeRequest<T_RequestOptions>,
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
    options: ClientOptions<T_RequestOptions>,
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

const createResponsePromise = (
  fetch: FetchLike,
  req: Request,
): ResponsePromise => {
  return {
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
    [Symbol.toStringTag]: "ResponsePromise",
  };
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
  _beforeRequestCallbacks: [] as BeforeRequest[],
  beforeRequest(
    callback: BeforeRequest,
  ) {
    this._beforeRequestCallbacks.push(callback);
    return this;
  },
  _resolvers: null,
  addResolvers(resolvers) {
    this._resolvers = {
      ...this._resolvers,
      ...resolvers,
    } as any;
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
      _middlewares: [...this._middlewares, ...(options.middlewares || [])],
    };
  },
};
