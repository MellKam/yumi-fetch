type AnyAsyncFunc = (...args: unknown[]) => Promise<unknown>;

export type FetchLike = (req: Request) => Promise<Response>;
export type FetchMiddleware = (next: FetchLike) => FetchLike;

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE";

export type RequestOptions = RequestInit & {
  method?: HTTPMethod;
};

export type Addon<
  A_Self extends Record<string, any> = {},
  A_RequestOptions extends Record<string, any> = {},
  A_ResponseMethods extends Record<string, ResponseMethod> = {},
  X_Self extends Record<string, any> = {},
  X_RequestOptions extends Record<string, any> = {},
  X_ResponseMethods extends Record<string, ResponseMethod> = {},
> = <
  C_Self extends X_Self,
  C_RequestOptinos extends X_RequestOptions,
  C_ResponseMethods extends X_ResponseMethods,
>(
  client:
    & Client<
      C_Self & A_Self,
      C_RequestOptinos & A_RequestOptions,
      C_ResponseMethods & A_ResponseMethods
    >
    & C_Self,
) =>
  & Client<
    C_Self & A_Self,
    C_RequestOptinos & A_RequestOptions,
    C_ResponseMethods & A_ResponseMethods
  >
  & C_Self
  & A_Self;

export type BeforeRequest<
  T_RequestOptions extends Record<string, any> = {},
> = (
  url: URL,
  options: Omit<RequestOptions, "headers"> & Partial<T_RequestOptions> & {
    headers: Headers;
  },
) => void;

export interface Client<
  T_Self extends Record<string, any> = Record<string, void>,
  T_RequestOptions extends Record<string, any> = {},
  T_ResponseMethods extends Record<string, ResponseMethod> = {},
> {
  _url: URL | undefined;

  _headers: Headers;
  headers(
    headers: HeadersInit,
  ): Client<T_Self, T_RequestOptions, T_ResponseMethods> & T_Self;

  _options: Omit<RequestOptions, "headers"> & T_RequestOptions;
  options(
    options: Omit<RequestOptions, "headers"> & T_RequestOptions,
  ): Client<T_Self, T_RequestOptions, T_ResponseMethods> & T_Self;

  _middlewares: FetchMiddleware[];
  middleware(
    mw: FetchMiddleware,
  ): Client<T_Self, T_RequestOptions, T_ResponseMethods> & T_Self;

  _beforeRequest: BeforeRequest<T_RequestOptions>[];
  beforeRequest(callback: BeforeRequest<T_RequestOptions>):
    & Client<T_Self, T_RequestOptions, T_ResponseMethods>
    & T_Self;

  _responseMethods: T_ResponseMethods | null;
  responseMethods<
    M_ResponseMethods extends Record<string, ResponseMethod>,
  >(
    this:
      & Client<
        T_Self,
        T_RequestOptions,
        T_ResponseMethods & M_ResponseMethods
      >
      & T_Self,
    responseMethods: M_ResponseMethods,
  ):
    & Client<
      T_Self,
      T_RequestOptions,
      T_ResponseMethods & M_ResponseMethods
    >
    & T_Self;

  fetch(
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptions>,
  ): Promise<Response> & T_ResponseMethods;

  addon<
    A_Self extends Record<string, any> = {},
    A_RequestOptions extends Record<string, any> = {},
    A_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
    X_Self extends Record<string, any> = {},
    X_RequestOptions extends Record<string, any> = {},
    X_ResponseMethods extends Record<string, ResponseMethod> = {},
  >(
    addon: Addon<
      A_Self,
      A_RequestOptions,
      A_ResponseMethods,
      X_Self,
      X_RequestOptions,
      X_ResponseMethods
    >,
  ): (
    (T_Self extends X_Self
      ? T_RequestOptions extends X_RequestOptions
        ? T_ResponseMethods extends X_ResponseMethods ? true : false
      : false
      : false)
  ) extends true ? (
      & Client<
        T_Self & A_Self,
        T_RequestOptions & A_RequestOptions,
        T_ResponseMethods & A_ResponseMethods
      >
      & T_Self
      & A_Self
    )
    : never;
}

const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
  const result = new Headers(h1);

  if (h2) {
    new Headers(h2).forEach((value, key) => {
      result.set(key, value);
    });
  }

  return result;
};

const linkMiddlewares =
  (middlewares: FetchMiddleware[]) => (fetch: FetchLike): FetchLike => {
    if (!middlewares.length) return fetch;
    return middlewares.reduceRight((next, mw) => mw(next), fetch);
  };

interface ResponsePromise extends Promise<Response> {
  _fetch: FetchLike;
  _req: Request;
}

export type ResponseMethod = (
  this: ResponsePromise,
  ...args: unknown[]
) => Promise<unknown>;

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

export type ClientOptions<
  T_RequestOptinos extends Record<string, any> = {},
> = {
  baseURL?: string | URL;
  headers?: HeadersInit;
  options?: Omit<RequestOptions, "headers"> & T_RequestOptinos;
};

export const createClient = <
  T_RequestOptinos extends Record<string, any> = {},
  T_ResponseMethods extends Record<string, ResponseMethod> = {},
>(
  options: ClientOptions<T_RequestOptinos> = {},
): Client<{}, T_RequestOptinos, T_ResponseMethods> => {
  return {
    _url: typeof options.baseURL === "string"
      ? new URL(options.baseURL)
      : options.baseURL,
    _headers: new Headers(options.headers),
    headers(headers) {
      new Headers(headers).forEach((value, key) =>
        this._headers.set(key, value)
      );
      return this;
    },
    _options: {} as RequestOptions & T_RequestOptinos,
    options(opts) {
      this._options = { ...this._options, ...opts };
      return this;
    },
    _middlewares: [],
    middleware(mw) {
      this._middlewares.push(mw);
      return this;
    },
    _beforeRequest: [] as BeforeRequest<T_RequestOptinos>[],
    beforeRequest(
      callback: BeforeRequest<T_RequestOptinos>,
    ) {
      this._beforeRequest.push(callback);
      return this;
    },
    _responseMethods: null,
    responseMethods(
      responseMethods,
    ) {
      this._responseMethods = {
        ...this._responseMethods,
        ...responseMethods,
      } as any;
      return this;
    },
    fetch(
      resource: URL | string,
      options: RequestOptions & Partial<T_RequestOptinos> = {},
    ): Promise<Response> & T_ResponseMethods {
      const url = new URL(resource, this._url);

      const opts = {
        ...this._options,
        ...options,
        headers: mergeHeaders(this._headers, options.headers),
      };

      for (const callback of this._beforeRequest) {
        callback(url, opts);
      }

      const req = new Request(url, opts);
      const wrappedFetch = linkMiddlewares(this._middlewares)(globalThis.fetch);

      if (!this._responseMethods) {
        return wrappedFetch(req) as Promise<Response> & T_ResponseMethods;
      }

      const promise = createResponsePromise(
        wrappedFetch,
        req,
      ) as ResponsePromise & T_ResponseMethods;

      return { ...promise, ...this._responseMethods };
    },
    addon(addon) {
      return addon(this as any);
    },
  };
};
