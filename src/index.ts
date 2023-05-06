const CONTENT_TYPES = {
  JSON: "application/json",
  URLENCODED: "application/x-www-form-urlencoded",
  FORM_DATA: "multipart/form-data",
  TEXT: "text/*",
  ANY: "*/*",
} as const;

const HEADERS = {
  ACCEPT: "Accept",
  CONTENT_TYPE: "Content-Type",
} as const;

export type SearchParam =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[];
export interface SearchParams {
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

/**
 * Response deserializer function
 */
export type Deserializer<T extends AnyAsyncFunc = AnyAsyncFunc> = (
  req: Request,
  fetch: Promise<Response>
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
  json:
    (req: Request, fetch: Promise<Response>) =>
    async <T extends JSONValue>() => {
      req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.JSON);
      return await fetch.then((res) => res.json() as Promise<T>);
    },
  text: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.TEXT);
    return await (await res).text();
  },
  blob: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.ANY);
    return await (await res).blob();
  },
  arrayBuffer: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.ANY);
    return await (await res).arrayBuffer();
  },
  formData: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.ANY);
    return await (await res).formData();
  },
  void: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set(HEADERS.ACCEPT, CONTENT_TYPES.ANY);
    await (await res).body?.cancel();
  },
};

type UnwrapDeserializers<T extends DeserializersObject> = {
  [K in keyof T]: ReturnType<T[K]>;
};

type ResponsePromise<T extends DeserializersObject> = Promise<Response> &
  UnwrapDeserializers<T>;

// can throw errro
export type Serializer = (data: any, headers: Headers) => BodyInit;
type SerializersObject = Record<string, Serializer>;

export interface DefaultSerializers extends SerializersObject {
  json: (data: JSONValue, headers: Headers) => string;
  params: (data: SearchParams) => URLSearchParams;
}

export const defaultSerializers: DefaultSerializers = {
  json: (data: JSONValue, headers) => {
    headers.append(HEADERS.CONTENT_TYPE, CONTENT_TYPES.JSON);
    return JSON.stringify(data);
  },
  params: (data: SearchParams) => {
    const params = new URLSearchParams();
    for (const key in data) {
      const value = data[key];
      if (value === undefined) continue;
      params.set(key, value.toString());
    }
    return params;
  },
};

type UnwrapSerializers<T extends SerializersObject> = {
  [K in keyof T]?: Parameters<T[K]>[0];
};

const mergeHeaders = (h1: HeadersInit, h2: HeadersInit) => {
  const result = new Headers(h1);
  new Headers(h2).forEach((value, key) => {
    result.set(key, value);
  });
  return result;
};

type YumiRequestInit<
  TSerializers extends SerializersObject = DefaultSerializers,
  TJSON extends JSONValue = JSONValue,
  TParams extends SearchParams = SearchParams
> = RequestInit &
  UnwrapSerializers<TSerializers> & {
    params?: TParams;
    json?: TJSON;
  };

type Method = "get" | "post" | "put" | "delete" | "patch";

type YumiMethdos<
  TDeserializers extends DeserializersObject,
  TSerializers extends DefaultSerializers
> = {
  [K in Method]: <
    T extends JSONValue = JSONValue,
    U extends SearchParams = SearchParams
  >(
    path: string,
    init?: Omit<YumiRequestInit<TSerializers, T, U>, "method">
  ) => ResponsePromise<TDeserializers>;
};

interface YumiInstance<
  TDeserializers extends DeserializersObject,
  TSerializers extends DefaultSerializers
> extends YumiMethdos<TDeserializers, TSerializers> {
  fetch: <
    T extends JSONValue = JSONValue,
    U extends SearchParams = SearchParams
  >(
    path: string,
    init?: YumiRequestInit<TSerializers, T, U>
  ) => ResponsePromise<TDeserializers>;
}

export const Yumi = <
  TDeserializers extends DeserializersObject,
  TSerializers extends DefaultSerializers
>(opts: {
  baseURL?: string;
  headers?: HeadersInit;
  deserializers: TDeserializers;
  serializers: TSerializers;
}) => {
  const _fetch = <
    T extends JSONValue = JSONValue,
    U extends SearchParams = SearchParams
  >(
    path: string,
    init: YumiRequestInit<TSerializers, T, U> = {}
  ) => {
    const headers =
      init.headers && opts.headers
        ? mergeHeaders(opts.headers, init.headers)
        : new Headers(init.headers || opts.headers);

    const url = new URL(path, opts.baseURL);
    if (init.params) {
      const params = opts.serializers.params(init.params);
      if (init.body === null) {
        init.body = params;
      } else {
        url.search = params.toString();
      }
    }

    if (!init.body) {
      for (const key in opts.serializers) {
        if (key === "params") continue;
        if (init[key]) {
          init.body = opts.serializers[key](init[key], headers);
        }
      }
    }

    init.headers = headers;

    const req = new Request(url, init);
    const responsePromise = fetch(req) as ResponsePromise<TDeserializers>;

    for (const key in opts.deserializers) {
      (responsePromise[key] as AnyAsyncFunc) = opts.deserializers[key](
        req,
        responsePromise
      );
    }

    return responsePromise;
  };

  const methods = {} as YumiMethdos<TDeserializers, TSerializers>;

  for (const method of ["get", "post", "put", "delete", "patch"] as Method[]) {
    methods[method] = <
      T extends JSONValue = JSONValue,
      U extends SearchParams = SearchParams
    >(
      path: string,
      init?: Omit<YumiRequestInit<TSerializers, T, U>, "method">
    ) => {
      (init as YumiRequestInit).method = "POST";
      return _fetch(path, init as YumiRequestInit);
    };
  }

  return {
    fetch: _fetch,
    ...methods,
  } as YumiInstance<TDeserializers, TSerializers>;
};

export const yumi = Yumi({
  deserializers: defaultDeserializers,
  serializers: defaultSerializers,
});
