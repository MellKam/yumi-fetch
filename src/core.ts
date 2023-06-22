import {
	AllBooelanEquals,
	IsExtends,
	mergeHeaders,
	mergeURLs,
} from "./utils.ts";
import { HTTPError, IHTTPError } from "./http_error.ts";

export type RequestOptions<T_RequestOptions = unknown> = RequestInit & {
	headers: Headers;
} & Partial<T_RequestOptions>;

export type FetchLike<T_RequestOptions = unknown> = (
	url: URL,
	options: RequestOptions<T_RequestOptions>,
) => Promise<Response>;

export type FetchMiddleware<T_RequestOptions = unknown> = (
	next: FetchLike<T_RequestOptions>,
) => FetchLike<T_RequestOptions>;

export interface ResponsePromise<
	T_RequestOptions = unknown,
	T_Resolvers = unknown,
> extends Promise<Response> {
	_url: URL;
	_opts: RequestOptions<T_RequestOptions>;
	_fetch: FetchLike<T_RequestOptions>;

	_then(
		onfulfilled?:
			| ((value: Response) => Response | PromiseLike<Response>)
			| null,
		onrejected?:
			| ((reason: unknown) => Response | PromiseLike<Response>)
			| null,
	): ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;
	_catch(
		onrejected?:
			| ((reason: unknown) => Response | PromiseLike<Response>)
			| undefined
			| null,
	): ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;
	_finally(
		onfinally?: (() => void) | null,
	): ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;
}

export const createResponsePromise = <
	T_RequestOptions = unknown,
	T_Resolvers = unknown,
>(
	fetch: FetchLike<T_RequestOptions>,
	url: URL,
	opts: RequestOptions<T_RequestOptions>,
	resolvers: T_Resolvers,
) => {
	return {
		...resolvers,
		_fetch: fetch,
		_url: url,
		_opts: opts,
		_then(onfulfilled, onrejected) {
			return {
				...this,
				_fetch: (url, opts) =>
					this._fetch(url, opts).then(onfulfilled, onrejected),
			};
		},
		_catch(onrejected) {
			return {
				...this,
				_fetch: (url, opts) => this._fetch(url, opts).catch(onrejected),
			};
		},
		_finally(onfinally) {
			return {
				...this,
				_fetch: (url, opts) => this._fetch(url, opts).finally(onfinally),
			};
		},
		then(onfulfilled, onrejected) {
			return this._fetch(this._url, this._opts).then(onfulfilled, onrejected);
		},
		catch(onrejected) {
			return this._fetch(this._url, this._opts).catch(onrejected);
		},
		finally(onfinally) {
			return this._fetch(this._url, this._opts).finally(onfinally);
		},
		[Symbol.toStringTag]: "Promise",
	} as ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;
};

/**
 * Represents a type of plugin that extends the client type with custom generics.
 *
 * ### Plugin modifications
 * A plugin modification is a set of generics that the plugin uses to modify the client's generics.
 *
 * @template M_Self (Self modifications) - The object of properties, that plugin will add to the client `Self` generic.
 * @template M_RequestOptions (Request options modifications) - Options that plugin will add to the client `RequestOptions` generic.
 * @template M_Resolvers (Resolvers modifications) - Resolvers that plugin will add to the client `Resolvers` generic.
 *
 * ### Plugin dependencies
 * An plugin dependency is a set of generics that the plugin requires from the client to be included.
 *
 * @template D_Self (Self dependencies) - Dependencies on client `Self` generic.
 * @template D_RequestOptions (Request options dependencies) - Dependencies on client `RequestOptions` generic.
 * @template D_Resolvers (Resolvers dependecies) - Dependencies on client `Resolvers` generic.
 */
export type ClientPlugin<
	M_Self = unknown,
	M_RequestOptions = unknown,
	M_Resolvers = unknown,
	D_Self = unknown,
	D_RequestOptions = unknown,
	D_Resolvers = unknown,
> = <
	C_Self extends D_Self,
	C_RequestOptions extends D_RequestOptions,
	C_Resolvers extends D_Resolvers,
>(
	client:
		& Client<
			C_Self & M_Self,
			C_RequestOptions & M_RequestOptions,
			C_Resolvers & M_Resolvers
		>
		& C_Self,
) =>
	& Client<
		C_Self & M_Self,
		C_RequestOptions & M_RequestOptions,
		C_Resolvers & M_Resolvers
	>
	& C_Self
	& M_Self;

export type HTTPErrorCreator = (
	res: Response,
) => IHTTPError | Promise<IHTTPError>;

/**
 * Extensible HTTP client entity
 *
 * @template T_Self - Allows you to extend the client with custom properties
 * @template T_RequestOptions - Allows you to extend request options with custom properties
 * @template T_Resolvers - Allows you to extend the response promise with custom methods, referred to as resolvers
 */
export interface Client<
	T_Self = unknown,
	T_RequestOptions = unknown,
	T_Resolvers = unknown,
> {
	/**
	 * @internal
	 */
	_baseURL: URL | undefined;
	/**
	 * @returns Shallow clone of the client with specified baseURL
	 */
	withBaseURL(baseURL: string | URL): this;

	/**
	 * @internal
	 */
	_headers: Headers;
	/**
	 * @returns Shallow clone of the client with new headers that are obtained by merging the current headers with the specified headers.
	 */
	withHeaders(headersInit: HeadersInit): this;

	/**
	 * @internal
	 */
	_options: Omit<RequestInit, "headers">;
	/**
	 * @returns Shallow clone of the client with new options that are obtained by merging the current options with the specified options.
	 */
	withOptions(options: Omit<RequestInit, "headers">): this;

	/**
	 * @internal
	 */
	_errorCreator: HTTPErrorCreator;
	/**
	 * @returns Shallow clone of the client with specified errorCreator
	 */
	withErrorCreator(errorCreator: HTTPErrorCreator): this;

	/**
	 * @internal
	 */
	_resolvers: T_Resolvers;
	withResolvers<M_Resolvers>(
		resolvers:
			& M_Resolvers
			& ThisType<
				& ResponsePromise<T_RequestOptions, T_Resolvers & M_Resolvers>
				& T_Resolvers
				& M_Resolvers
			>,
	):
		& Client<
			T_Self,
			T_RequestOptions,
			T_Resolvers & M_Resolvers
		>
		& T_Self;

	/**
	 * @template M_Self Properties object that will modify the current client type, in particular `T_Self` generic
	 *
	 * @returns Shallow clone of the client with new specified properties
	 */
	withProperties<M_Self>(
		self:
			& M_Self
			& ThisType<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>,
	):
		& Client<
			T_Self & M_Self,
			T_RequestOptions,
			T_Resolvers
		>
		& T_Self
		& M_Self;

	withPlugin<
		M_Self,
		M_RequestOptions,
		M_Resolvers,
		D_Self,
		D_RequestOptions,
		D_Resolvers,
	>(
		plugin: ClientPlugin<
			M_Self,
			M_RequestOptions,
			M_Resolvers,
			D_Self,
			D_RequestOptions,
			D_Resolvers
		>,
	): AllBooelanEquals<
		[
			IsExtends<T_Self, D_Self>,
			IsExtends<T_RequestOptions, D_RequestOptions>,
			IsExtends<T_Resolvers, D_Resolvers>,
		],
		true
	> extends true ?
			& Client<
				T_Self & M_Self,
				T_RequestOptions & M_RequestOptions,
				T_Resolvers & M_Resolvers
			>
			& T_Self
			& M_Self
		: never;

	/**
	 * @internal
	 */
	_middlewares: FetchMiddleware<T_RequestOptions>[];
	/**
	 * @returns Shallow clone of the client with new list of middlewares that is obtained by merging the current list of middlewares and the specified list.
	 */
	withMiddlewares<M_RequestOptions>(
		middlewares: FetchMiddleware<T_RequestOptions & M_RequestOptions>[],
	):
		& Client<
			T_Self,
			T_RequestOptions & M_RequestOptions,
			T_Resolvers
		>
		& T_Self;
	/**
	 * Shortcut for `withMiddlewares()` to insert only one item
	 *
	 * @returns Shallow clone of the client with new list of middlewares that is obtained by merging the current list of middlewares and the specified middleware.
	 */
	withMiddleware<M_RequestOptions>(
		middleware: FetchMiddleware<T_RequestOptions & M_RequestOptions>,
	):
		& Client<
			T_Self,
			T_RequestOptions & M_RequestOptions,
			T_Resolvers
		>
		& T_Self;
	/**
	 * @internal Cache for the fetch linked with middlewares
	 */
	_linkedFetch: FetchLike<T_RequestOptions> | null;
	/**
	 * @internal
	 * Connects `this._fetch` with `this._middlewares` and returns a `FetchLike` function.
	 * Default link order __FIFO__ (first in first out)
	 *
	 * ```
	 * this._middlewares: [a, b, c]
	 *
	 * { // begin a
	 *   { // begin b
	 *     { // begin c
	 *       this._fetch()
	 *     } // end c
	 *   } // end b
	 * } // end a
	 * ```
	 *
	 * You can overwrite it to use __LIFO__ (last in first out) if you want. You just need to chenge `reduceRight()` method to `reduce()`.
	 *
	 * ```ts
	 * client._linkMiddlewares = function() {
	 *   return this._middlewares.reduce(
	 *     (next, mw) => mw(next),
	 *     this._fetch
	 *   );
	 * }
	 * ```
	 *
	 * ```
	 * _middlewares: [a, b, c]
	 *
	 * { // begin c
	 *   { // begin b
	 *     { // begin a
	 *       this._fetch()
	 *     } // end a
	 *   } // end b
	 * } // end c
	 * ```
	 */
	_linkMiddlewares(): FetchLike<T_RequestOptions>;
	/**
	 * @internal
	 * Linked fetch stale status. By default, it is set to "false". However, if middleware has been added, it changes to "true".
	 * When a request is made, this status is checked, and if it is "true", a new linkedFetch will be created.
	 */
	_linkedFetchStale: boolean;

	/**
	 * @internal
	 */
	_fetch: FetchLike<T_RequestOptions>;
	fetch(
		resource: URL | string,
		options?: RequestInit & Partial<T_RequestOptions>,
	): ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers;
}

/**
 * The plain object that implements `Client` interface.
 * You don't need to instantiate it to use it, as you do with classes.
 *
 * The clientCore automatically handles HTTP errors for you. It checks each response using the "res.ok" field, and if it's not okay, it throws an error. This default error handling is helpful when writing middlewares because it provides a reliable way to handle errors.
 *
 * #### Why plain object and not class ???
 * There were many attempts to write it in classes, but nothing succeeded. It was especially difficult to satisfy typescript. So it was decided to choose objects instead of classes.
 * In spite of this, in some places we still have to lie to the typescript about types.
 *
 * #### Concept of public and private fields
 * Basically, since we don't use classes, we have to manage our private fields ourselves. In our case, we treat fields starting with `_` (underscore) as private, and any others as public.
 */
export const clientCore: Client = {
	_baseURL: undefined,
	withBaseURL(baseURL) {
		return { ...this, _baseURL: new URL(baseURL) };
	},
	_headers: new Headers(),
	withHeaders(headersInit) {
		return { ...this, _headers: mergeHeaders(this._headers, headersInit) };
	},
	_options: {},
	withOptions(options) {
		return { ...this, _options: { ...this._options, ...options } };
	},
	_resolvers: {},
	withResolvers<T_Self, T_RequestOptions, T_Resolvers, M_Resolvers>(
		this: Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self,
		resolvers:
			& M_Resolvers
			& ThisType<
				& ResponsePromise<T_RequestOptions, T_Resolvers & M_Resolvers>
				& T_Resolvers
				& M_Resolvers
			>,
	) {
		return {
			...this,
			_resolvers: { ...this._resolvers, ...resolvers },
		};
	},
	withProperties<T_Self, T_RequestOptions, T_Resolvers, M_Self>(
		this: Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self,
		self:
			& M_Self
			& ThisType<Client<T_Self, T_RequestOptions, T_Resolvers> & T_Self>,
	) {
		return {
			...(this as
				& Client<T_Self & M_Self, T_RequestOptions, T_Resolvers>
				& T_Self),
			...self,
		};
	},
	withPlugin(plugin) {
		return plugin(this as any);
	},
	_middlewares: [],
	withMiddlewares(middlewares) {
		return {
			...this,
			_middlewares: [...this._middlewares, ...middlewares],
			_linkedFetchStale: true,
		};
	},
	withMiddleware(middleware) {
		return this.withMiddlewares([middleware]);
	},
	_linkedFetch: null,
	_linkMiddlewares() {
		return this._middlewares.reduceRight((next, mw) => mw(next), this._fetch);
	},
	_linkedFetchStale: false,
	_errorCreator: HTTPError.create,
	withErrorCreator(errorCreator) {
		return {
			...this,
			_errorCreator: errorCreator,
		};
	},
	async _fetch(url, options) {
		const res = await globalThis.fetch(url, options);
		if (res.ok) return res;
		throw await this._errorCreator(res);
	},
	fetch(resource, options = {}) {
		const mergedURL = mergeURLs(resource, this._baseURL);
		const mergedOptions = {
			...this._options,
			...options,
			headers: mergeHeaders(this._headers, options.headers),
		};

		if (this._linkedFetchStale) {
			this._linkedFetch = this._linkMiddlewares();
			this._linkedFetchStale = false;
		}

		return createResponsePromise(
			this._linkedFetch || this._fetch,
			mergedURL,
			mergedOptions,
			this._resolvers,
		);
	},
};
