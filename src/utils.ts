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

export type SearchParam =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[];
export interface SearchParams {
  [k: string]: SearchParam | undefined;
}

export const BODY_METHODS = {
  json: "application/json",
  text: "text/*",
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
} as const;

export type BodyMethod = keyof typeof BODY_METHODS;

export const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
] as const;

export type HTTPMethod = typeof HTTP_METHODS[number];

export type AnyAsyncFunc = (...args: any[]) => Promise<any>;

export class HTTPError extends Error {
  public readonly status: number;
  public readonly url: string;

  constructor(
    public readonly req: Request,
    public readonly res: Response,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(
      message ?? `Request failed with status ${res.status}: ${res.statusText}`,
      options,
    );

    this.status = res.status;
    this.url = req.url;
    this.name = "HTTPError";
  }
}

export type ParamsSerializer = (params: SearchParams) => URLSearchParams;
export const paramsSerializer: ParamsSerializer = (data) => {
  const params = new URLSearchParams();
  for (const key in data) {
    const value = data[key];
    if (value) params.set(key, value.toString());
  }
  return params;
};

export const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
  const result = new Headers(h1);

  if (h2) {
    new Headers(h2).forEach((value, key) => {
      result.set(key, value);
    });
  }

  return result;
};
