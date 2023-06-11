import { Addon, Client } from "../core.ts";

export type OnSuccess = (res: Response) => Promise<void> | void;
export type OnError = (err: unknown) => Promise<void> | void;

export interface ResponseEvents {
  _onSuccess: OnSuccess[];
  _onError: OnError[];
  onSuccess<T_Self extends ResponseEvents>(
    this: Client<T_Self> & T_Self,
    callback: OnSuccess,
  ): this;
  onError<T_Self extends ResponseEvents>(
    this: Client<T_Self> & T_Self,
    callback: OnError,
  ): this;
}

export const responseEvents: Addon<ResponseEvents> = (client) => {
  const _onError: OnError[] = [];
  const _onSuccess: OnSuccess[] = [];

  client.addMiddleware((next) => async (url, opts) => {
    try {
      const res = await next(url, opts);
      for (const callback of _onSuccess) {
        await callback(res);
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
