import { Addon, Client, MergedRequestOptions } from "../core.ts";

export type OnAbort = <T_RequestOptions = unknown>(
  url: URL,
  opts: MergedRequestOptions<T_RequestOptions>,
  err: DOMException,
) => void;

export interface AbortEvents {
  _onAbort: OnAbort[];
  onAbort<T_Self extends AbortEvents>(
    this: Client<T_Self> & T_Self,
    callback: OnAbort,
  ): this;
}

export const abort: Addon<AbortEvents, { timeout: number }> = (client) => {
  const _onAbort: OnAbort[] = [];

  client.beforeRequest((_, opts) => {
    if (!opts.timeout) return;

    const controller = new AbortController();
    opts.signal = controller.signal;
    const timeoutID = setTimeout(() => controller.abort(), opts.timeout);

    return () => clearTimeout(timeoutID);
  });

  client.addMiddleware((next) => (url, opts) => {
    return next(url, opts).catch((error) => {
      if (error.name === "AbortError") {
        for (const callback of _onAbort) {
          callback(url, opts, error);
        }
      }
      throw error;
    });
  });

  return {
    ...client,
    _onAbort,
    onAbort(callback) {
      this._onAbort.push(callback);
      return this;
    },
  };
};
