import { FetchMiddleware } from "../core.ts";

export class HTTPError extends Error {
  readonly status: number;

  constructor(
    public readonly request: Request,
    public readonly response: Response,
    public readonly text?: string,
    public readonly json?: unknown,
  ) {
    super(response.statusText);
    this.status = response.status;
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

export const errorHandler: FetchMiddleware = (next) => async (req) => {
  const res = await next(req);
  if (res.ok) return res;

  throw await HTTPError.create(req, res);
};
