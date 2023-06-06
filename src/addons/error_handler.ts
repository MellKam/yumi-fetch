import { Addon } from "../core.ts";

export class HTTPError extends Error {
  readonly status: number;

  constructor(
    public readonly request: Request,
    public readonly response: Response,
    public readonly text?: string,
    public readonly json?: unknown,
  ) {
    super(`${response.status} ${response.statusText}`);
    this.status = response.status;
    this.name = "HTTPError";
  }

  get url() {
    return this.request.url;
  }

  static async create(req: Request, res: Response) {
    if (!res.body) {
      return new HTTPError(req, res);
    }

    let text: string;
    try {
      text = await res.text();
    } catch (_) {
      return new HTTPError(req, res);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (_) {
      return new HTTPError(req, res, text);
    }

    return new HTTPError(req, res, text, json);
  }
}

export type OnSuccess = (req: Request, res: Response) => Promise<void> | void;
export type OnError = (err: HTTPError) => Promise<void> | void;

export interface ResponseEvents {
  _onSuccess: OnSuccess[];
  _onError: OnError[];
  /** @ts-expect-error */
  onSuccess(callback: OnSuccess): NonNullable<this["__returnClient"]>;
  /** @ts-expect-error */
  onError(callback: OnError): NonNullable<this["__returnClient"]>;
}

export const errorHandler: Addon<ResponseEvents> = (client) => {
  const _onError: OnError[] = [];
  const _onSuccess: OnSuccess[] = [];

  client.useMiddleware((next) => async (req) => {
    const res = await next.call(this, req);
    if (res.ok) {
      for (const callback of _onSuccess) {
        await callback(req, res);
      }
      return res;
    }

    const error = await HTTPError.create(req, res);

    for (const callback of _onError) {
      await callback(error);
    }

    throw error;
  });

  return {
    ...client,
    _onError,
    _onSuccess,
    onError(callback) {
      this._onError.push(callback);
      return this;
    },
    onSuccess(callback) {
      this._onSuccess.push(callback);
      return this;
    },
  };
};
