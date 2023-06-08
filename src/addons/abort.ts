import { Addon } from "../core.ts";

export type OnAbort = (req: Request, err: DOMException) => void;

export interface AbortEvents {
  _onAbort: OnAbort[];
  /** @ts-expect-error */
  onAbort(callback: OnAbort): NonNullable<this["__T_ReturnThis"]>;
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

  client.addMiddleware((next) => (req) => {
    return next(req).catch((error) => {
      if (error.name === "AbortError") {
        for (const callback of _onAbort) {
          callback(req, error);
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
