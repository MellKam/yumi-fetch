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
  };

export type FetchLike = (req: Request) => Promise<Response>;
export type FetchMiddleware = (
  next: FetchLike,
) => FetchLike;

export type AfterResponseCleaner = () => void;
export type BeforeRequestCallback<
  T_RequestOptions = unknown,
> = (
  url: URL,
  options:
    & Omit<RequestOptions, "headers">
    & { headers: Headers }
    & Partial<T_RequestOptions>,
) => void | AfterResponseCleaner;

export interface ResponsePromise<T_Resolvers = unknown>
  extends Promise<Response> {
  _req: Request;
  _fetch: FetchLike;
  _then(
    onfulfilled?:
      | ((value: Response) => Response | PromiseLike<Response>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => Response | PromiseLike<Response>)
      | undefined
      | null,
  ): ResponsePromise<T_Resolvers> & T_Resolvers;
  _catch(
    onrejected?:
      | ((reason: any) => Response | PromiseLike<Response>)
      | undefined
      | null,
  ): ResponsePromise<T_Resolvers> & T_Resolvers;
  _finally(
    onfinally?: (() => void) | undefined | null,
  ): ResponsePromise<T_Resolvers> & T_Resolvers;
}

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

const createResponsePromise = <T_Resolvers>(
  fetch: FetchLike,
  req: Request,
  resolvers: T_Resolvers,
) => {
  return {
    ...resolvers,
    _fetch: fetch,
    _req: req,
    _then(onfulfilled, onrejected) {
      return {
        ...this,
        _fetch: (req) => this._fetch(req).then(onfulfilled, onrejected),
      };
    },
    _catch(onrejected) {
      return { ...this, _fetch: (req) => this._fetch(req).catch(onrejected) };
    },
    _finally(onfinally) {
      return { ...this, _fetch: (req) => this._fetch(req).finally(onfinally) };
    },
    then(onfulfilled, onrejected) {
      return this._fetch(this._req).then(onfulfilled, onrejected);
    },
    catch(onrejected) {
      return this._fetch(this._req).catch(onrejected);
    },
    finally(onfinally) {
      return this._fetch(this._req).finally(onfinally);
    },
    [Symbol.toStringTag]: "Promise",
  } as ResponsePromise<T_Resolvers> & T_Resolvers;
};

export type ExtendOptions<
  T_RequestOptions = unknown,
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
  M_Self = unknown,
  M_RequestOptions = unknown,
  M_Resolvers = unknown,
  D_Self = unknown,
  D_RequestOptions = unknown,
  D_Resolvers = unknown,
> = <
  C_Self extends D_Self,
  C_RequestOptinos extends D_RequestOptions,
  C_Resolvers extends D_Resolvers,
>(
  client:
    & Client<
      C_Self & M_Self,
      C_RequestOptinos & M_RequestOptions,
      C_Resolvers & M_Resolvers
    >
    & C_Self,
) =>
  & Client<
    C_Self & M_Self,
    C_RequestOptinos & M_RequestOptions,
    C_Resolvers & M_Resolvers
  >
  & C_Self
  & M_Self;

export interface IHTTPError extends Error {
  readonly response: Response;
  readonly status: number;
  readonly url: string;
}

export type HTTPErrorCreator = (
  res: Response,
) => IHTTPError | Promise<IHTTPError>;

export class HTTPError extends Error implements IHTTPError {
  readonly status: number;

  constructor(
    public readonly response: Response,
    public readonly text?: string,
    public readonly json?: unknown,
  ) {
    super(`${response.status} ${response.statusText}`);
    this.name = "HTTPError";
    this.status = response.status;
  }

  get url() {
    return this.response.url;
  }

  static async create(res: Response) {
    if (!res.body) {
      return new HTTPError(res);
    }

    let text: string;
    try {
      text = await res.text();
    } catch (_) {
      return new HTTPError(res);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (_) {
      return new HTTPError(res, text);
    }

    return new HTTPError(res, text, json);
  }
}

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
 */
export interface Client<
  T_Self = unknown,
  T_RequestOptions = unknown,
  T_Resolvers = unknown,
> {
  _baseURL: URL | undefined;

  _headers: Headers;
  setHeaders(
    init: BetterHeaderInit,
  ): this;

  _options: Omit<RequestOptions, "headers"> & T_RequestOptions;
  setOptions(
    options: Omit<RequestOptions, "headers"> & T_RequestOptions,
  ): this;

  _errorCreator: HTTPErrorCreator;
  serErrorCreator(
    errorCreator: HTTPErrorCreator,
  ): this;

  _middlewares: FetchMiddleware[];
  addMiddleware(
    middleware: FetchMiddleware,
  ): this;

  _beforeRequest: BeforeRequestCallback<T_RequestOptions>[];
  beforeRequest(
    callback: BeforeRequestCallback<T_RequestOptions>,
  ): this;

  _resolvers: T_Resolvers;
  addResolvers<M_Resolvers>(
    resolvers:
      & M_Resolvers
      & ThisType<ResponsePromise<T_Resolvers> & T_Resolvers & M_Resolvers>,
  ):
    & Client<T_Self, T_RequestOptions, T_Resolvers & M_Resolvers>
    & T_Self;

  fetch(
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptions>,
  ): ResponsePromise<T_Resolvers> & T_Resolvers;

  extend(
    options: ExtendOptions,
  ): this;

  addon<
    M_Self = unknown,
    M_RequestOptions = unknown,
    M_Resolvers = unknown,
    D_Self = unknown,
    D_RequestOptions = unknown,
    D_Resolvers = unknown,
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
  > extends true ?
      & Client<
        T_Self & M_Self,
        T_RequestOptions & M_RequestOptions,
        T_Resolvers & M_Resolvers
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
  baseURL?: URL,
  extendURL?: URL | string,
): URL | undefined => {
  if (baseURL && extendURL) {
    if (typeof extendURL === "object") return extendURL;

    const basePathname = baseURL.pathname.endsWith("/")
      ? baseURL.pathname
      : baseURL + "/";
    const extendPathname = extendURL.startsWith("/")
      ? extendURL.slice(1)
      : extendURL;

    return new URL(basePathname + extendPathname, baseURL.origin);
  }

  if (baseURL) return baseURL;
  if (extendURL) return new URL(extendURL);
  return;
};

/**
 * The plain object that implements `Client` interface.
 * You don't need to instantiate it to use it, as you do with classes.
 *
 * #### Why plain object and not class ???
 * There were many attempts to write it in classes, but nothing succeeded. It was especially difficult to satisfy typescript. So it was decided to choose objects instead of classes.
 * In spite of this, in some places we still have to lie to the about types.
 *
 * #### Concept of public and private fields
 * Basically, since we don't use classes, we have to manage our private fields ourselves. In our case, we treat fields starting with `_` (underscore) as private, and any others as public.
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
  _errorCreator: HTTPError.create,
  serErrorCreator(errorCreator) {
    this._errorCreator = errorCreator;
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
  addResolvers<T_Self, T_RequestOptions, T_Resolvers, M_Resolvers>(
    this: Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self,
    resolvers:
      & M_Resolvers
      & ThisType<ResponsePromise<T_Resolvers> & T_Resolvers & M_Resolvers>,
  ) {
    this._resolvers = { ...this._resolvers, ...resolvers };
    return this as
      & Client<T_Self, T_RequestOptions, T_Resolvers & M_Resolvers>
      & T_Self;
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

    const _fetch: FetchLike = async (req) => {
      try {
        const res = await globalThis.fetch(req);
        if (res.ok) return res;
        throw await this._errorCreator(res);
      } finally {
        for (const cleaner of cleaners) cleaner();
      }
    };

    const wrappedFetch = linkMiddlewares(this._middlewares)(_fetch);

    return createResponsePromise(wrappedFetch, req, this._resolvers);
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
