import { Addon, Client } from "../core.ts";

export type RetyrUntil = (
  res?: Response,
  error?: unknown,
) => boolean | Promise<boolean>;

export type SkipRetry = (req: Request) => boolean;

type RetryData = {
  readonly req: Request;
  readonly res?: Response;
  readonly error?: unknown;
  readonly attemptsMade: number;
};

export type OnRetry = (
  data: RetryData,
) => void | Promise<void>;

const retryUntil: RetyrUntil = (res, err) =>
  !!err || (!!res && res.status < 500);

export type RetryOptoins = {
  delayTimer: number;
  maxAttempts: number;
  retryUntil: RetyrUntil;
  skip?: SkipRetry;
};

const defaultRetryOptions: RetryOptoins = {
  retryUntil,
  delayTimer: 0,
  maxAttempts: 10,
};

export class MaxRetryAttemptsError extends Error {
  constructor(
    public maxAttempts: number,
    public lastResponse?: Response,
    options?: ErrorOptions,
  ) {
    super("Max number of attempts exceeded", options);
    this.name = "MaxRetryAttemptsError";
  }
}

interface RetryEvent {
  _onRetry: OnRetry[];
  onRetry<T_Self extends RetryEvent>(
    this: Client<T_Self> & T_Self,
    callback: OnRetry,
  ): this;
}

export const retry =
  (options: Partial<RetryOptoins> = {}): Addon<RetryEvent> => (client) => {
    const { skip, delayTimer, maxAttempts, retryUntil } = {
      ...defaultRetryOptions,
      ...options,
    };

    const _onRetry: OnRetry[] = [];

    client.addMiddleware((next) => async (req) => {
      let attemptsMade = 0;

      if (skip && skip(req)) {
        return next(req);
      }

      const checkStatus = async (
        res?: Response,
        err?: unknown,
      ): Promise<Response> => {
        const done = await Promise.resolve(retryUntil(res, err));

        if (done && res) return res;
        if (done && err) throw err;

        if (attemptsMade >= maxAttempts) {
          throw new MaxRetryAttemptsError(maxAttempts, res, { cause: err });
        }

        if (delayTimer) {
          await new Promise((res) => {
            setTimeout(res, delayTimer);
          });
        }

        const retryData: RetryData = {
          attemptsMade,
          req,
          error: err,
          res,
        };

        for (const callback of _onRetry) {
          await callback(retryData);
        }

        attemptsMade++;

        return await next(req)
          .then(checkStatus, (error) => checkStatus(undefined, error));
      };

      return await next(req)
        .then(checkStatus, (error) => checkStatus(undefined, error));
    });

    return {
      ...client,
      _onRetry,
      onRetry(callback) {
        this._onRetry.push(callback);
        return this;
      },
    };
  };
