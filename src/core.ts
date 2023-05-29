export type AnyAsyncFunc = (...args: any[]) => Promise<any>;

export type FetchLike = (req: Request) => Promise<Response>;

export type FetchMiddleware = (next: FetchLike) => FetchLike;

export type Addon<
  A_Self extends Record<string, any> = {},
  A_RequestOptinos extends Record<string, any> = {},
  A_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
> = <
  C_Self extends Record<string, any> = {},
  C_RequestOptinos extends Record<string, any> = {},
  C_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
>(
  client:
    & Client<
      C_Self & A_Self,
      C_RequestOptinos & A_RequestOptinos,
      C_ResponseMethods & A_ResponseMethods
    >
    & C_Self,
) =>
  & Client<
    C_Self & A_Self,
    C_RequestOptinos & A_RequestOptinos,
    C_ResponseMethods & A_ResponseMethods
  >
  & C_Self
  & A_Self;

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

export type BeforeRequest<
  T_RequestOptions extends Record<string, any> = {},
> = (
  url: URL,
  options: Exclude<RequestOptions, "headers"> & Partial<T_RequestOptions> & {
    headers: Headers;
  },
) => void;

export interface Client<
  T_Self extends Record<string, any> = {},
  T_RequestOptinos extends Record<string, any> = {},
  T_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
> {
  _url: URL | undefined;

  _headers: Headers;
  headers(
    headers: HeadersInit,
  ): Client<T_Self, T_RequestOptinos, T_ResponseMethods> & T_Self;

  _options: Exclude<RequestOptions, "headers"> & T_RequestOptinos;
  options(
    options: Exclude<RequestOptions, "headers"> & T_RequestOptinos,
  ): Client<T_Self, T_RequestOptinos, T_ResponseMethods> & T_Self;

  _middlewares: FetchMiddleware[];
  middleware(
    mw: FetchMiddleware,
  ): Client<T_Self, T_RequestOptinos, T_ResponseMethods> & T_Self;

  _beforeRequest: BeforeRequest<T_RequestOptinos>[];
  beforeRequest<
    C_RequestOptinos extends Record<string, any> = {},
  >(callback: BeforeRequest<T_RequestOptinos & C_RequestOptinos>):
    & Client<T_Self, T_RequestOptinos & C_RequestOptinos, T_ResponseMethods>
    & T_Self;

  _responseMethods: Record<string, ResponseMethodCreator> | null;
  responseMethods<
    M_ResponseMethodCreators extends Record<string, ResponseMethodCreator>,
  >(responseMethods: M_ResponseMethodCreators):
    & Client<
      T_Self,
      T_RequestOptinos,
      T_ResponseMethods & UnwrapResponseMethods<M_ResponseMethodCreators>
    >
    & T_Self;

  fetch(
    resource: URL | string,
    options?: RequestOptions & Partial<T_RequestOptinos>,
  ): Promise<Response> & T_ResponseMethods;

  addon<
    A_Self extends Record<string, any> = {},
    A_RequestOptinos extends Record<string, any> = {},
    A_ResponseMethods extends Record<string, AnyAsyncFunc> = {},
  >(
    addon: Addon<
      A_Self,
      A_RequestOptinos,
      A_ResponseMethods
    >,
  ):
    & Client<
      T_Self & A_Self,
      T_RequestOptinos & A_RequestOptinos,
      T_ResponseMethods & A_ResponseMethods
    >
    & T_Self
    & A_Self;
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
  (middlewares: FetchMiddleware[]) => (fetch: FetchLike) => {
    if (!middlewares.length) return fetch;
    return middlewares.reduceRight((next, mw) => mw(next), fetch);
  };

export type ResponseMethodCreator<T extends AnyAsyncFunc = AnyAsyncFunc> = (
  fetch: FetchLike,
  req: Request,
) => T;
type UnwrapResponseMethods<T extends Record<string, ResponseMethodCreator>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

const createResponsePromise = <T extends Record<string, ResponseMethodCreator>>(
  fetch: FetchLike,
  req: Request,
  responseMethods: T,
): Promise<Response> & UnwrapResponseMethods<T> => {
  const promise = {
    then(onfulfilled, onrejected) {
      return fetch(req).then(onfulfilled, onrejected);
    },
    catch(onrejected) {
      return fetch(req).then(null, onrejected);
    },
    finally(onfinally) {
      return fetch(req).finally(onfinally);
    },
    [Symbol.toStringTag]: "ResponsePromise",
  } as Promise<Response> & UnwrapResponseMethods<T>;

  for (const key in responseMethods) {
    promise[key] = responseMethods[key](fetch, req) as any;
  }

  return promise;
};

export const clientCore: Client = {
  _url: undefined,
  _headers: new Headers(),
  headers(headers) {
    new Headers(headers).forEach((value, key) => this._headers.set(key, value));
    return this;
  },
  _options: {},
  options(opts) {
    this._options = { ...this.options, ...opts };
    return this;
  },
  _middlewares: [],
  middleware(mw) {
    this._middlewares.push(mw);
    return this;
  },
  _beforeRequest: [],
  beforeRequest(callback) {
    this._beforeRequest.push(callback);
    return this as any;
  },
  _responseMethods: null,
  responseMethods(responseMethods) {
    this._responseMethods = {
      ...this._responseMethods,
      ...responseMethods,
    };
    return this as any;
  },
  fetch(resource, options = {}) {
    let url = typeof resource == "string"
      ? new URL(resource, this._url)
      : resource;

    let opts = {
      ...this._options,
      ...options,
      headers: mergeHeaders(this._headers, options.headers),
    };

    for (const callback of this._beforeRequest) {
      callback(url, opts);
    }

    const req = new Request(url, opts);

    const wrappedFetch = linkMiddlewares(this._middlewares)(globalThis.fetch);

    return this._responseMethods
      ? createResponsePromise(
        wrappedFetch,
        req,
        this._responseMethods,
      )
      : wrappedFetch(req);
  },
  addon(addon) {
    return addon(this as any);
  },
};
