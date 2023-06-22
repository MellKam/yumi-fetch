export interface IHTTPError extends Error {
	readonly response: Response;
	readonly status: number;
	readonly url: string;
}

const isError = (err: unknown): err is Error => {
	return typeof err === "object" &&
		err !== null &&
		"name" in err && typeof err.name === "string" && "message" in err &&
		typeof err.message === "string";
};

export const isHTTPError = (err: unknown): err is IHTTPError => {
	return (
		isError(err) &&
		"response" in err &&
		err.response instanceof Response &&
		"status" in err &&
		typeof err.status === "number" &&
		"url" in err &&
		typeof err.url === "string"
	);
};

export class HTTPError extends Error implements IHTTPError {
	readonly status: number;

	constructor(
		public readonly response: Response,
		public readonly text?: string,
		public readonly json?: unknown,
		options?: ErrorOptions,
	) {
		const message = text || response.statusText || "Unknown error";
		super(`${response.status} ${message}`, options);
		this.status = response.status;
		this.name = "HTTPError";
	}

	get url() {
		return this.response.url;
	}

	static async create(res: Response) {
		if (!res.body) {
			return new HTTPError(res);
		}

		let text: string | undefined;
		let json: unknown | undefined;

		try {
			text = await res.text();
			json = JSON.parse(text);
		} catch (_) { /* Ignore errors */ }

		return new HTTPError(res, text, json);
	}
}
