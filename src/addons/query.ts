import { Addon } from "../core.ts";

export interface SearchParams {
  [k: string]:
    | string
    | number
    | boolean
    | readonly (string | number | boolean)[]
    | undefined;
}

export const querySerializer: Addon<unknown, { query: SearchParams }> = (
  client,
) =>
  client.addMiddleware((next) => (url, opts) => {
    if (opts.query) {
      for (const key in opts.query) {
        const value = opts.query[key];
        if (value) url.searchParams.set(key, value.toString());
      }
    }
    return next(url, opts);
  });
