export interface HTTPError<T_Body = unknown> extends Error {
	readonly request: Request;
	readonly response: Response;
	readonly status: number;
	readonly url: string;
	readonly body: T_Body;
}

const isError = (err: unknown): err is Error => {
	return (
		typeof err === "object" &&
		err !== null &&
		"name" in err &&
		typeof err.name === "string" &&
		"message" in err &&
		typeof err.message === "string"
	);
};

export const isHTTPError = (err: unknown): err is HTTPError => {
	return (
		isError(err) &&
		"response" in err &&
		err.response instanceof Response &&
		"request" in err &&
		err.request instanceof Request &&
		"status" in err &&
		typeof err.status === "number" &&
		"url" in err &&
		typeof err.url === "string"
	);
};

export class YumiError<T_Body = unknown> extends Error implements HTTPError {
	public readonly name = "YumiError";
	public readonly status: number;
	public readonly request: Request;
	public readonly response: Response;
	public readonly body: T_Body;

	constructor(
		message: string,
		request: Request,
		response: Response,
		body: T_Body,
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

export const createYumiError = async <T_Body = unknown>(
	request: Request,
	response: Response,
	options?: ErrorOptions,
) => {
	const fallbackMessage = response.statusText || "Unknown error";
	let body: T_Body = undefined as T_Body;

	if (!response.body || response.type === "opaque") {
		return new YumiError<T_Body>(
			fallbackMessage,
			request,
			response,
			body,
			options,
		);
	}

	try {
		body = (await response.text()) as T_Body;
		body = JSON.parse(body as string);
	} catch (_) {
		/* Ignore errors */
	}

	const message = typeof body === "string"
		? body
		: body
		? JSON.stringify(body)
		: fallbackMessage;

	return new YumiError<T_Body>(message, request, response, body, options);
};
