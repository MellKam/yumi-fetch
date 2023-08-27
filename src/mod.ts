export interface HttpError<TBody = unknown> extends Error {
	readonly request: Request;
	readonly response: Response;
	readonly status: number;
	readonly url: string;
	readonly body: TBody;
}

export class FetchError<TBody = unknown> extends Error implements HttpError {
	name = "FetchError";

	public readonly status: number;
	public readonly request: Request;
	public readonly response: Response;
	public readonly body: TBody;

	constructor(
		message: string,
		request: Request,
		response: Response,
		body: TBody,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.request = request;
		this.response = response;
		this.body = body;
		this.status = response.status;
	}

	get url() {
		return this.response.url;
	}
}

const createFetchError = async <TBody = unknown>(
	request: Request,
	response: Response,
	options?: ErrorOptions,
) => {
	const message = response.statusText
		? `${response.status} ${response.statusText} (${request.url})`
		: `${response.status} (${request.url})`;
	let body: TBody = null as TBody;

	if (!response.body || response.type === "opaque") {
		return new FetchError<TBody>(
			message,
			request,
			response,
			body,
			options,
		);
	}

	try {
		body = await response.text() as TBody;
		const contentType = response.headers.get("Content-Type");

		if (
			contentType &&
			(contentType === CONTENT_TYPES.json ||
				contentType.split(";")[0] === CONTENT_TYPES.json)
		) {
			body = JSON.parse(body as string) as TBody;
		}
	} catch (_) {
		/* Ignore errors */
	}

	return new FetchError<TBody>(message, request, response, body, options);
};

export type QueryParams = {
	[k: string]:
		| string
		| number
		| boolean
		| (string | number | boolean)[]
		| undefined;
};

const mergeURLs = (url: string, base?: URL | string): URL => {
	if (base) {
		const result = new URL(base);
		result.pathname += (result.pathname.endsWith("/") ? "" : "/") +
			(url.startsWith("/") ? url.slice(1) : url);

		return result;
	}

	return new URL(url);
};

type IsEmptyObject<T> = keyof T extends never ? true : false;

export type ExtractParams<
	T extends string,
	// deno-lint-ignore ban-types
	Params extends Record<string, string | number> = {},
> = T extends `${infer _Start}{${infer Param}}${infer Rest}`
	? ExtractParams<Rest, Params & { [K in Param]: string | number }>
	: Params;

const mergeHeaders = (h1: HeadersInit, h2?: HeadersInit) => {
	const result = new Headers(h1);
	if (h2) {
		new Headers(h2).forEach((value, key) => result.set(key, value));
	}

	return result;
};

type ResponseBodyParseMethod =
	| "json"
	| "arrayBuffer"
	| "formData"
	| "text"
	| "blob";

const CONTENT_TYPES = {
	json: "application/json",
	text: "text/*",
	formData: "multipart/form-data",
	arrayBuffer: "*/*",
	blob: "*/*",
} as const;

type ResponseBodyParsedMap = {
	json: unknown;
	arrayBuffer: ArrayBuffer;
	formData: FormData;
	text: string;
	blob: Blob;
};

const isPlainObject = (obj: unknown): obj is Record<PropertyKey, unknown> => {
	return typeof obj === "object" && obj !== null &&
		Object.prototype.toString.call(obj) === "[object Object]";
};

type FetchLike = (
	resource: URL,
	options: Omit<RequestInit, "body"> & {
		headers: Headers;
		body?: BodyInit | null | Record<string, unknown>;
	},
) => Promise<Response>;
export type Middleware = (next: FetchLike) => FetchLike;

export type ClientOptions = {
	baseUrl?: URL | string;
	querySerializer?: (query: QueryParams) => string;
	jsonSerializer?: (json: unknown) => string;
	middlewares?: Middleware[];
} & Omit<RequestInit, "body" | "method">;

const defaultQuerySerializer = (query: QueryParams) => {
	const searchParams = new URLSearchParams();
	for (const key in query) {
		const value = query[key];
		if (value) searchParams.set(key, value.toString());
	}
	return searchParams.toString();
};

export const createClient = (clientOptions?: ClientOptions) => {
	const {
		baseUrl,
		headers = {},
		querySerializer = defaultQuerySerializer,
		jsonSerializer = JSON.stringify,
		middlewares = [],
		..._options
	} = clientOptions || {};

	return {
		_baseUrl: baseUrl,
		_options,
		_headers: headers,
		_middlewares: middlewares,
		_querySerializer: querySerializer,
		_jsonSerializer: jsonSerializer,
		async fetch<
			TResource extends string = string,
			TParseMethod extends ResponseBodyParseMethod | undefined = undefined,
		>(
			resource: TResource,
			...args: IsEmptyObject<ExtractParams<TResource>> extends true ? [
					options?:
						& Omit<RequestInit, "body">
						& {
							body?: BodyInit | null | Record<string, unknown>;
							query?: QueryParams;
							parseAs?: TParseMethod;
							params?: undefined;
						},
				]
				: [
					options:
						& Omit<RequestInit, "body">
						& {
							body?: BodyInit | null | Record<string, unknown>;
							query?: QueryParams;
							parseAs?: TParseMethod;
							params: ExtractParams<TResource>;
						},
				]
		): Promise<
			TParseMethod extends ResponseBodyParseMethod
				? ResponseBodyParsedMap[TParseMethod]
				: Response
		> {
			const [options = {}] = args;

			let _resource: string = resource;
			if (options.params) {
				for (const key in options.params) {
					_resource = _resource.replace(
						`{${key}}`,
						(options.params[key as keyof typeof options.params] as
							| string
							| number).toString(),
					);
				}
			}

			const url = mergeURLs(_resource, this._baseUrl);
			if (options.query) {
				url.search = this._querySerializer(options.query);
			}

			const headers = mergeHeaders(this._headers, options?.headers);
			if (options.parseAs) {
				headers.set("Accept", CONTENT_TYPES[options.parseAs]);
			}

			const isJSON = !!options.body && (Array.isArray(options.body) ||
				isPlainObject(options.body));

			if (isJSON) {
				headers.set("Content-Type", CONTENT_TYPES.json);
			}

			const _options = {
				...this._options,
				...options,
				headers,
				body: (isJSON ? this._jsonSerializer(options.body) : options.body) as
					| BodyInit
					| null,
			};

			const res = await this._middlewares.reduceRight(
				(next, mw) => mw(next),
				fetch as FetchLike,
			)(url, _options);

			if (!res.ok) {
				throw await createFetchError(new Request(url, _options), res);
			}
			if (_options.parseAs) {
				return await res[_options.parseAs]();
			}

			return res as any;
		},
	};
};

export type Client = ReturnType<typeof createClient>;
