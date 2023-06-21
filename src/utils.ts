/**
 * @internal
 * Always returns a new `Headers` object. Does not mutate input arguments.
 */
export const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
  const result = new Headers(h1);
  if (h2) {
    new Headers(h2).forEach((value, key) => result.set(key, value));
  }

  return result;
};

/**
 * @internal
 * Always returns a new `URL` object. Does not mutate input arguments.
 *
 * @param url A `URL` object (without a hash and query parameters) or a string pathname. If the `URL` object is passed, the base argument will be ignored.
 * @param base Optional `URL` object or string url (without a hash and query parameters)
 *
 * @example
 * ```ts
 * new URL("/user", "http://example.com/api/")
 * // URL{ "http://example.com/user" } 😕
 * mergeURLs("/user", "http://example.com/api/")
 * // URL{ "http://example.com/api/user" } 😃
 * ```
 */
export const mergeURLs = (url: URL | string, base?: URL | string): URL => {
  if (base && url) {
    if (typeof url === "object") return new URL(url);

    const result = new URL(base);
    result.pathname +=
      (result.pathname.endsWith("/") ? "" : "/") +
      (url.startsWith("/") ? url.slice(1) : url);

    return result;
  }

  return base ? new URL(base) : new URL(url);
};

export type IsExtends<A, B> = A extends B ? true : false;

/**
 * Are all elements of the array `T` equal to an element of `U`
 *
 * @example
 * ```ts
 * IsAllEquals<[false, false], false>
 * // true
 * IsAllEquals<[false, true], false>
 * // false
 * ```
 */
export type AllEquals<T extends boolean[], U extends boolean> = T extends []
  ? true
  : T extends [infer First extends boolean, ...infer Rest extends boolean[]]
  ? U extends First
    ? AllEquals<Rest, U>
    : false
  : never;
