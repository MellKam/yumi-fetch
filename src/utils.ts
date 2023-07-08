export const APP_JSON = "application/json";
export const ACCEPT_HEADER = "Accept";
export const CONTENT_TYPE_HEADER = "Content-Type";

/**
 * @internal
 * Returns a new Headers object by merging the provided HeadersInit arguments.
 * The input arguments are not modified.
 *
 * @example
 * ```ts
 * mergeHeaders(
 *   { "Accept": "application/json" },
 *   { "Content-Type": "application/json" }
 * )
 * // Headers {
 * //  "Accept": "application/json"
 * //  "Content-Type": "application/json"
 * // }
 * ```
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
 * Returns a new URL object by merging a provided URL object or pathname string with an optional base URL object or string.
 * The input arguments are not modified.
 *
 * @param url A URL object or a string representing the pathname. If a URL object is passed, the base argument will be ignored.
 * @param base Optional URL object or string representing the base URL.
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
	if (base && typeof url === "string") {
		const result = new URL(base);
		result.pathname += (result.pathname.endsWith("/") ? "" : "/") +
			(url.startsWith("/") ? url.slice(1) : url);

		return result;
	}

	return new URL(url);
};

export type IsExtends<A, B> = A extends B ? true : false;

/**
 * Determines whether all elements of the boolean array `T` are equal to a boolean `U`.
 *
 * @example
 * ```ts
 * IsAllEquals<[false, false], false>
 * // true
 * IsAllEquals<[false, true], false>
 * // false
 * ```
 */
export type AllBooelanEquals<
	T extends boolean[],
	U extends boolean,
> = T extends [] ? true
	: T extends [infer First extends boolean, ...infer Rest extends boolean[]]
		? U extends First ? AllBooelanEquals<Rest, U>
		: false
	: never;
