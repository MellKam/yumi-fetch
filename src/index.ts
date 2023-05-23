import {
  AnyAsyncFunc,
  BODY_METHODS,
  BodyMethod,
  HTTP_METHODS,
  HTTPError,
  HTTPMethod,
  JSONValue,
  mergeHeaders,
  ParamsSerializer,
  paramsSerializer,
  SearchParams,
} from "./utils.ts";

type FetchMiddleware = (next: FetchLike) => FetchLike;

interface ClientOptions<
  S extends SerializersObject,
  D extends DeserializersObject,
  Q extends ParamsSerializer | undefined,
> {
  baseURL?: string | URL;
  headers?: HeadersInit | Headers;
  deserializers?: D;
  serializers?: S;
  // beforeRequest
  // onError
  // onSuccess
  paramsSerializer?: Q;
  middlewares?: FetchMiddleware[];
}

type FetchLike = (req: Request) => Promise<Response>;

type Deserializer<T extends AnyAsyncFunc = AnyAsyncFunc> = (
  fetch: FetchLike,
  req: Request,
) => T;
type DeserializersObject = Record<string, Deserializer>;
type UnwrapDeserializers<T extends DeserializersObject> = {
  [K in keyof T]: ReturnType<T[K]>;
};

interface DefaultDeserializers extends DeserializersObject {
  json: () => <T extends JSONValue>() => Promise<T>;
  text: () => () => Promise<string>;
  arrayBuffer: () => () => Promise<ArrayBuffer>;
  blob: () => () => Promise<Blob>;
  formData: () => () => Promise<FormData>;
}

const createDefaultDeserializers = () => {
  const deserializers = {} as DefaultDeserializers;

  for (const key in BODY_METHODS) {
    deserializers[key] = (fetch, req) => async () => {
      req.headers.set("Accept", BODY_METHODS[key as BodyMethod]);
      return await fetch(req).then((res) => res[key as BodyMethod]());
    };
  }

  return deserializers;
};

type Serializer = (data: any, headers: Headers) => BodyInit;
type SerializersObject = Record<string, Serializer>;
type UnwrapSerializers<T extends SerializersObject> = {
  [K in keyof T]?: Parameters<T[K]>[0];
};

interface DefaultSerializers extends SerializersObject {
  json: (data: JSONValue, headers: Headers) => string;
}

const defaultSerializers: DefaultSerializers = {
  json: (data, headers) => {
    headers.set("Content-Type", BODY_METHODS.json);
    return JSON.stringify(data);
  },
};

type RequestOptions<
  S extends SerializersObject,
  Q extends ParamsSerializer | undefined,
> =
  & RequestInit
  & UnwrapSerializers<S>
  & (Q extends undefined ? {} : { query?: SearchParams });

type RequestResource = Request | URL | string;

type ClientMethods<
  S extends SerializersObject,
  D extends DeserializersObject,
  Q extends ParamsSerializer | undefined,
> = {
  [Method in HTTPMethod]: (
    resource: RequestResource,
    options?: Exclude<RequestOptions<S, Q>, "method">,
  ) => ResponsePromise<D>;
};

interface ClientBase<
  S extends SerializersObject,
  D extends DeserializersObject,
  Q extends ParamsSerializer | undefined,
> {
  _url?: URL;
  _headers: Headers;
  _paramsSerializer: Q;
  _middlewares: FetchMiddleware[];
  _deserializers: D;
  _serializers: S;
  extend<
    Serializers extends SerializersObject,
    Deserializers extends DeserializersObject,
    Query extends ParamsSerializer | undefined,
  >(
    options: ClientOptions<Serializers, Deserializers, Query>,
  ): Client<
    S & Serializers,
    D & Deserializers,
    Query extends undefined ? Q : Query
  >;
  fetch(
    resource: RequestResource,
    options?: RequestOptions<S, Q>,
  ): ResponsePromise<D>;
}

interface Client<
  S extends SerializersObject,
  D extends DeserializersObject,
  Q extends ParamsSerializer | undefined,
> extends ClientBase<S, D, Q>, ClientMethods<S, D, Q> {}

type ResponsePromise<D extends DeserializersObject> =
  & Promise<Response>
  & UnwrapDeserializers<D>;

const createResponsePromise = <D extends DeserializersObject>(
  fetch: FetchLike,
  req: Request,
  deserializers: D,
): ResponsePromise<D> => {
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
  } as ResponsePromise<D>;

  for (const key in deserializers) {
    promise[key] = deserializers[key](fetch, req) as any;
  }

  return promise;
};

const linkMiddlewares =
  (middlewares: FetchMiddleware[]) => (fetch: FetchLike): FetchLike => {
    return middlewares.reduceRight((acc, curr) => curr(acc), fetch) || fetch;
  };

const throwableFetch: FetchLike = async (req) => {
  const res = await globalThis.fetch(req);
  if (!res.ok) {
    throw new HTTPError(req, res);
  }
  return res;
};

export const Client = <
  S extends SerializersObject,
  D extends DeserializersObject,
  Q extends ParamsSerializer | undefined = undefined,
>(opts: ClientOptions<S, D, Q> = {}) => {
  const client = {
    _url: opts.baseURL ? new URL(opts.baseURL) : undefined,
    _headers: new Headers(opts.headers),
    _paramsSerializer: opts.paramsSerializer,
    _middlewares: opts.middlewares || [],
    _deserializers: (opts.deserializers || {}) as D,
    _serializers: (opts.serializers || {}) as S,
    extend(options) {
      return {
        ...this,
        _url: options.baseURL ? new URL(options.baseURL) : this._url,
        _headers: mergeHeaders(this._headers, options.headers),
        _deserializers: { ...this._deserializers, ...options.deserializers },
        _serializers: { ...this._serializers, ...options.serializers },
        _middlewares: [...this._middlewares, ...(options.middlewares || [])],
      };
    },
    fetch(resource, options = {}) {
      let req: Request;

      if (resource instanceof Request) {
        req = new Request(resource, options);
      } else {
        const url = typeof resource == "string"
          ? new URL(resource, this._url)
          : resource;

        if (options.query && this._paramsSerializer) {
          url.search = this._paramsSerializer(options.query).toString();
        }

        const headers = mergeHeaders(this._headers, options.headers);

        let body = options.body;

        if (!body && options.method !== "GET") {
          for (const key in this._serializers) {
            if (options[key]) {
              body = this._serializers[key](
                options[key],
                headers,
              );
              break;
            }
          }
        }

        req = new Request(url, { ...options, headers, body });
      }

      const _fetch = this._middlewares.length
        ? linkMiddlewares(this._middlewares)(throwableFetch)
        : throwableFetch;

      return createResponsePromise(
        _fetch,
        req,
        this._deserializers,
      );
    },
  } as ClientBase<S, D, Q>;

  for (const method of HTTP_METHODS) {
    (client as Client<S, D, Q>)[method] = function (
      resourse,
      options,
    ) {
      (options as RequestOptions<S, Q>).method = method;
      return this.fetch(resourse, options);
    };
  }

  return client as Client<S, D, Q>;
};

export const client = Client({
  deserializers: createDefaultDeserializers(),
  serializers: defaultSerializers,
  paramsSerializer,
});

export { HTTPError } from "./utils.ts";
