import { Addon } from "../core.ts";

interface SearchParams {
  [k: string]:
    | string
    | number
    | boolean
    | readonly (string | number | boolean)[]
    | undefined;
}

export const queryAddon: Addon<{}, { query: SearchParams }> = (client) => {
  return {
    ...client.beforeRequest((url, opts) => {
      if (opts.query) {
        for (const key in opts.query) {
          const value = opts.query[key];
          if (value) url.searchParams.set(key, value.toString());
        }
      }
    }),
  };
};
