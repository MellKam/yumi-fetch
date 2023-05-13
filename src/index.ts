const APP_JSON = "application/json";
const FORM_DATA = "multipart/form-data";
const ANY_TEXT = "text/*";
const ANY_CONTENT = "*/*";

const ACCEPT_HEADER = "Accept";
const CONTENT_TYPE_HEADER = "Content-Type";

export type SearchParam =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[];
export interface SearchParamsInit {
  [k: string]: SearchParam | undefined;
}

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONArray
  | JSONObject;
export type JSONArray = JSONValue[];
export interface JSONObject {
  [x: string]: JSONValue | undefined;
}

type AnyAsyncFunc = (...args: any[]) => Promise<any>;

export type Deserializer<T extends AnyAsyncFunc = AnyAsyncFunc> = (
  req: Request,
  fetch: Promise<Response>,
) => T;

type DeserializersObject = Record<string, Deserializer>;

export interface DefaultDeserializers extends DeserializersObject {
  json: Deserializer<<T extends JSONValue>() => Promise<T>>;
  text: Deserializer<() => Promise<string>>;
  blob: Deserializer<() => Promise<Blob>>;
  arrayBuffer: Deserializer<() => Promise<ArrayBuffer>>;
  formData: Deserializer<() => Promise<FormData>>;

  void: Deserializer<() => Promise<void>>;
}

export const defaultDeserializers: DefaultDeserializers = {
  json: (req, fetch) => async <T extends JSONValue>() => {
    req.headers.set(ACCEPT_HEADER, APP_JSON);
    return await (await fetch).json() as T;
  },
  text: (req, fetch) => async () => {
    req.headers.set(ACCEPT_HEADER, ANY_TEXT);
    return await (await fetch).text();
  },
  blob: (req, fetch) => async () => {
    req.headers.set(ACCEPT_HEADER, ANY_CONTENT);
    return await (await fetch).blob();
  },
  arrayBuffer: (req, fetch) => async () => {
    req.headers.set(ACCEPT_HEADER, ANY_CONTENT);
    return await (await fetch).arrayBuffer();
  },
  formData: (req, fetch) => async () => {
    req.headers.set(ACCEPT_HEADER, FORM_DATA);
    return await (await fetch).formData();
  },
  void: (req, fetch) => async () => {
    req.headers.set(ACCEPT_HEADER, ANY_CONTENT);
    await (await fetch).body?.cancel();
  },
};

type UnwrapDeserializers<T extends DeserializersObject> = {
  [K in keyof T]: ReturnType<T[K]>;
};

type ResponsePromise<T extends DeserializersObject> =
  & Promise<Response>
  & UnwrapDeserializers<T>;

// can throw errro
export type Serializer = (data: any, headers: Headers) => BodyInit;
type SerializersObject = Record<string, Serializer>;

export interface DefaultSerializers extends SerializersObject {
  json: (data: JSONValue, headers: Headers) => string;
  // formURL: (data: SearchParamsInit) => URLSearchParams;
}

export const defaultSerializers: DefaultSerializers = {
  json: (data, headers) => {
    headers.append(CONTENT_TYPE_HEADER, APP_JSON);
    return JSON.stringify(data);
  },
  // formURL: (data) => {
  //   const params = new URLSearchParams();
  //   for (const key in data) {
  //     const value = data[key];
  //     if (value === undefined) continue;
  //     params.set(key, value.toString());
  //   }
  //   return params;
  // },
};

type UnwrapSerializers<T extends SerializersObject> = {
  [K in keyof T]?: Parameters<T[K]>[0];
};

const mergeHeaders = (
  h1?: HeadersInit,
  h2?: HeadersInit,
): Headers | undefined => {
  if (h1 && h2) {
    const result = new Headers(h1);
    new Headers(h2)
      .forEach((value, key) => result.set(key, value));
    return result;
  }

  return h1 || h2 ? new Headers(h1 || h2) : undefined;
};

type Input = string | URL;

type Init<
  S extends SerializersObject = DefaultSerializers,
> =
  & RequestInit
  & UnwrapSerializers<S>
  & {
    // params?: SearchParams;
    json?: JSONValue;
  };

type YumiFetch<
  D extends DeserializersObject,
  S extends SerializersObject,
> = (
  input: Input,
  init?: Init<S>,
) => ResponsePromise<D>;

const METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
] as const;

type HTTPMethod = typeof METHODS[number];

type YumiMethod<
  D extends DeserializersObject,
  S extends SerializersObject,
> = (
  input: Input,
  init?: Omit<Init<S>, "method">,
) => ResponsePromise<D>;

type YumiMethdos<
  D extends DeserializersObject,
  S extends DefaultSerializers,
> = {
  [K in HTTPMethod]: YumiMethod<D, S>;
};

type YumiExtend<
  BaseD extends DeserializersObject,
  BaseS extends DefaultSerializers,
> = <D extends DeserializersObject, S extends SerializersObject>(
  opts: Partial<YumiOptions<D, S>>,
) => YumiInstance<BaseD & D, BaseS & S>;

interface YumiInstance<
  D extends DeserializersObject,
  S extends DefaultSerializers,
> extends YumiMethdos<D, S> {
  fetch: YumiFetch<D, S>;
  extend: YumiExtend<D, S>;
}

interface YumiOptions<
  TDeserializers extends DeserializersObject,
  TSerializers extends SerializersObject,
> {
  baseURL?: string | URL;
  headers?: HeadersInit;
  deserializers: TDeserializers;
  serializers: TSerializers;
  fetch: (
    input: URL | RequestInfo,
    init?: RequestInit | undefined,
  ) => Promise<Response>;
  onRequest?: ((req: Request) => void | Promise<void>)[];
  onError?: ((err: unknown) => void | Promise<void>)[];
  onResponse?: ((req: Request, res: Response) => void | Promise<void>)[];
}

export const Yumi = <
  D extends DeserializersObject,
  S extends DefaultSerializers,
>(opts: YumiOptions<D, S>) => {
  const _fetch: YumiFetch<D, S> = (input, init = {}) => {
    const headers = mergeHeaders(opts.headers, init.headers) ?? new Headers();

    const url = new URL(input, opts.baseURL);

    if (!init.body) {
      for (const key in opts.serializers) {
        if (init[key]) {
          init.body = opts.serializers[key](init[key], headers);
          break;
        }
      }
    }

    init.headers = headers;

    const req = new Request(url, init);

    const responsePromise = new Promise<Response>(async (resolve, reject) => {
      try {
        if (opts.onRequest) {
          for (const hook of opts.onRequest) {
            await hook(req);
          }
        }

        const res = await fetch(req);

        if (!res.ok) {
          const error = new Error(await res.text());
          if (opts.onError) {
            for (const hook of opts.onError) {
              await hook(error);
            }
          }
          throw error;
        }

        if (opts.onResponse) {
          for (const hook of opts.onResponse) {
            await hook(req, res);
          }
        }
        resolve(res);
      } catch (error) {
        reject(error);
      }
    }) as ResponsePromise<D>;

    for (const key in opts.deserializers) {
      (responsePromise[key] as AnyAsyncFunc) = opts.deserializers[key](
        req,
        responsePromise,
      );
    }

    return responsePromise;
  };

  const extend: YumiExtend<D, S> = (newOpts) => {
    return Yumi({
      baseURL: newOpts.baseURL ?? opts.baseURL,
      fetch: newOpts.fetch ?? opts.fetch!,
      headers: mergeHeaders(newOpts.headers, opts.headers),
      deserializers: Object.assign(
        {},
        opts.deserializers,
        newOpts.deserializers,
      ),
      serializers: Object.assign({}, opts.serializers, newOpts.serializers),
    });
  };

  const yumi = { fetch: _fetch, extend } as YumiInstance<D, S>;

  for (const method of METHODS) {
    yumi[method] = (input, init) => {
      (init as Init).method = method;
      return yumi.fetch(input, init as Init);
    };
  }

  return yumi;
};

export const yumi = Yumi({
  deserializers: defaultDeserializers,
  serializers: defaultSerializers,
  fetch: globalThis.fetch,
});

export default yumi;
