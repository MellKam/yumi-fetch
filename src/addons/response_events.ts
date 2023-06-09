import { Addon } from "../core.ts";

export type OnSuccess = (req: Request, res: Response) => Promise<void> | void;
export type OnError = (err: unknown) => Promise<void> | void;

export interface ResponseEvents {
  _onSuccess: OnSuccess[];
  _onError: OnError[];
  /** @ts-expect-error */
  onSuccess(callback: OnSuccess): NonNullable<this["__T_ReturnThis"]>;
  /** @ts-expect-error */
  onError(callback: OnError): NonNullable<this["__T_ReturnThis"]>;
}

export const errorHandler: Addon<ResponseEvents> = (client) => {
  const _onError: OnError[] = [];
  const _onSuccess: OnSuccess[] = [];

  client.addMiddleware((next) => async (req) => {
    try {
      const res = await next(req);
      for (const callback of _onSuccess) {
        await callback(req, res);
      }
      return res;
    } catch (error) {
      for (const callback of _onError) {
        await callback(error);
      }
      throw error;
    }
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
