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

type ResponseSerializer<T extends AnyAsyncFunc> = (
  req: Request,
  promise: Promise<Response>
) => T;

interface DefaultSerializers
  extends Record<string, ResponseSerializer<() => Promise<any>>> {
  json: ResponseSerializer<<T extends JSONValue>() => Promise<T>>;
  text: ResponseSerializer<() => Promise<string>>;
  blob: ResponseSerializer<() => Promise<Blob>>;
  arrayBuffer: ResponseSerializer<() => Promise<ArrayBuffer>>;
  formData: ResponseSerializer<() => Promise<FormData>>;

  void: ResponseSerializer<() => Promise<void>>;
}

const defaultSerializers: DefaultSerializers = {
  json:
    (req: Request, res: Promise<Response>) =>
    async <T extends JSONValue>() => {
      req.headers.set("accept", "application/json");
      return (await (await res).json()) as Promise<T>;
    },
  text: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set("accept", "text/*");
    return await (await res).text();
  },
  blob: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set("accept", "*/*");
    return await (await res).blob();
  },
  arrayBuffer: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set("accept", "*/*");
    return await (await res).arrayBuffer();
  },
  formData: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set("accept", "*/*");
    return await (await res).formData();
  },
  void: (req: Request, res: Promise<Response>) => async () => {
    req.headers.set("accept", "*/*");
    await (await res).body?.cancel();
  },
};

type SerializersToMethods<
  S extends Record<string, ResponseSerializer<AnyAsyncFunc>>
> = {
  [K in keyof S]: ReturnType<S[K]>;
};

type ResponsePromise<
  T extends Record<string, ResponseSerializer<AnyAsyncFunc>>
> = Promise<Response> & SerializersToMethods<T>;

interface YumiRequestInit<T extends JSONValue = JSONValue> extends RequestInit {
  // params?: URLSearchParams | SearchParams | string;
  json?: T;
}

export class YumiFetch<
  TCustomSerializers extends Record<string, ResponseSerializer<AnyAsyncFunc>>,
  TSerializers extends DefaultSerializers &
    TCustomSerializers = DefaultSerializers & TCustomSerializers
> {
  private serializers: TSerializers;
  constructor(
    private baseURL?: string | URL,
    customSerializers?: TCustomSerializers
  ) {
    this.serializers = {
      ...defaultSerializers,
      ...customSerializers,
    } as TSerializers;
  }

  fetch<T extends JSONValue>(
    input: URL | RequestInfo,
    init: YumiRequestInit<T> = {}
  ) {
    let req: Request;
    const headers = {} as Record<string, string>;

    if (init.json) {
      init.body = JSON.stringify(init.json);
      headers["Content-Type"] = "application/json";
    }

    if (init.headers) {
      init.headers = { ...init.headers, ...headers };
    } else {
      init.headers = headers;
    }

    if (typeof input === "string") {
      const url = new URL(input, this.baseURL);
      req = new Request(url, init);
    } else if (input instanceof URL) {
      req = new Request(input, init);
    } else {
      req = new Request(input, init);
    }

    const promise = new Promise<Response>((resolve, reject) => {
      fetch(req).then(resolve, reject);
    }) as ResponsePromise<TSerializers>;

    for (const key in this.serializers) {
      promise[key] = this.serializers[key](req, promise) as any;
    }

    return promise;
  }

  get<T extends JSONValue>(
    input: URL | RequestInfo,
    init: Omit<YumiRequestInit<T>, "method"> = {}
  ) {
    return this.fetch(input, init);
  }

  post<T extends JSONValue>(
    input: URL | RequestInfo,
    init: Omit<YumiRequestInit<T>, "method"> = {}
  ) {
    (init as YumiRequestInit).method = "POST";
    return this.fetch(input, init);
  }

  delete<T extends JSONValue>(
    input: URL | RequestInfo,
    init: Omit<YumiRequestInit<T>, "method"> = {}
  ) {
    (init as YumiRequestInit).method = "DELETE";
    return this.fetch(input, init);
  }

  patch<T extends JSONValue>(
    input: URL | RequestInfo,
    init: Omit<YumiRequestInit<T>, "method"> = {}
  ) {
    (init as YumiRequestInit).method = "PATCH";
    return this.fetch(input, init);
  }

  put<T extends JSONValue>(
    input: URL | RequestInfo,
    init: Omit<YumiRequestInit<T>, "method"> = {}
  ) {
    (init as YumiRequestInit).method = "PUT";
    return this.fetch(input, init);
  }
}

export const yumi = new YumiFetch();
