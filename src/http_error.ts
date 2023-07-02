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
	public readonly status: number;
	public readonly request: Request;
	public readonly response: Response;
	public readonly body: T_Body;

	constructor(
		request: Request,
		response: Response,
		body: T_Body,
		options?: ErrorOptions,
	) {
		const message = typeof body === "string"
			? body
			: body
			? JSON.stringify(body)
			: response.statusText || "Unknown error";
		super(response.status + " " + message, options);

		this.request = request;
		this.response = response;
		this.body = body;
		this.status = response.status;
		this.name = "YumiError";
	}

	get url() {
		return this.response.url;
	}

	static async create<T_Body = unknown>(
		request: Request,
		response: Response,
		options?: ErrorOptions,
	) {
		let body: T_Body = undefined as T_Body;

		if (!response.body) {
			return new YumiError<T_Body>(request, response, body, options);
		}

		try {
			body = await response.json();
		} catch (_) {
			/* Ignore errors */
		}

		return new YumiError<T_Body>(request, response, body, options);
	}
}
