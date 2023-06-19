import {
	Client,
	ClientPlugin,
	RequestOptions,
	ResponsePromise,
} from "../../core.ts";

class TimeoutError extends Error {
	constructor(
		public readonly req: Request,
		public readonly timeout: number,
		options?: ErrorOptions,
	) {
		super(`The request has exceeded time limit ${timeout}s`, options);
		this.name = "TimeoutError";
	}
}

export type OnTimeout<T_RequestOptions = unknown> = (
	url: URL,
	opts: RequestOptions<T_RequestOptions>,
	err: TimeoutError,
) => void;

export interface AbortEvents {
	_onTimeout: OnTimeout[];
	onTimeout<T_Self extends AbortEvents, T_RequestOptions>(
		this: Client<T_Self, T_RequestOptions> & T_Self,
		callback: OnTimeout<T_RequestOptions>,
	): this;
}

interface TimeoutResolver {
	onTimeout<T_RequestOptions, T_Resolvers extends TimeoutResolver>(
		this: ResponsePromise<T_RequestOptions, T_Resolvers> & T_Resolvers,
		callback: (
			url: URL,
			opts: RequestOptions<T_RequestOptions>,
			err: TimeoutError,
		) => void,
	): this;
}

export const timeout = (
	globalTimeout?: number,
): ClientPlugin<AbortEvents, { timeout: number }, TimeoutResolver> => {
	return (client) => {
		const _onTimeout: OnTimeout[] = [];

		return client
			.withProperties<AbortEvents>({
				_onTimeout,
				onTimeout(callback) {
					this._onTimeout.push(callback);
					return this;
				},
			})
			.withResolvers<TimeoutResolver>({
				onTimeout(callback) {
					return this._catch((err) => {
						if (err.name === "TimeoutError") {
							callback(this._url, this._opts, err);
						}
						throw err;
					});
				},
			})
			.withMiddleware((next) => async (url, opts) => {
				const timeout = opts.timeout || globalTimeout;
				if (!timeout) return next(url, opts);

				const controller = new AbortController();
				opts.signal = controller.signal;
				const timeoutID = setTimeout(
					() => {
						controller.abort(new TimeoutError(new Request(url, opts), timeout));
					},
					timeout,
				);

				try {
					return await next(url, opts);
				} catch (error) {
					if (
						typeof error === "object" && error !== null &&
						(error as TimeoutError).name === "TimeoutError"
					) {
						for (const callback of _onTimeout) {
							callback(url, opts, error as TimeoutError);
						}
					}
					throw error;
				} finally {
					clearTimeout(timeoutID);
				}
			});
	};
};
