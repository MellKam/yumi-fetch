import { Client, ClientPlugin, RequestOptions } from "../../core.ts";

export type RetryUntil = (
	res?: Response,
	error?: unknown,
) => boolean | Promise<boolean>;

export type RetryData<T_RequestOptions> = {
	readonly url: URL;
	readonly options: RequestOptions<T_RequestOptions>;
	readonly res?: Response;
	readonly error?: unknown;
	readonly attemptsMade: number;
};

export type OnRetry = <T_RequestOptions>(
	data: RetryData<T_RequestOptions>,
) => void | Promise<void>;

const retryUntil: RetryUntil = (res, err) =>
	!res || (typeof err === "object" && err !== null && "status" in err &&
		typeof err.status === "number" && err.status < 500);

export type RetryOptoins = {
	/**
	 * @default 0
	 */
	delayTimer: number;
	/**
	 * @default 10
	 */
	maxAttempts: number;
	retryUntil: RetryUntil;
};

const defaultRetryOptions: RetryOptoins = {
	retryUntil,
	delayTimer: 0,
	maxAttempts: 10,
};

export class MaxRetryAttemptsError extends Error {
	constructor(
		public maxAttempts: number,
		public lastResponse?: Response,
		options?: ErrorOptions,
	) {
		super("Max number of attempts exceeded", options);
		this.name = "MaxRetryAttemptsError";
	}
}

export interface RetryEvent {
	_onRetry: OnRetry[];
	onRetry<T_Self extends RetryEvent>(
		this: Client<T_Self> & T_Self,
		callback: OnRetry,
	): this;
}

export interface RetryOptions {
	retry: Partial<RetryOptoins>;
}

export const retry = (
	globalOptions?: Partial<RetryOptoins>,
): ClientPlugin<RetryEvent, RetryOptions> => {
	return (client) => {
		const _onRetry: OnRetry[] = [];

		return client
			.withProperties<RetryEvent>({
				_onRetry,
				onRetry(callback) {
					this._onRetry.push(callback);
					return this;
				},
			})
			.withMiddleware((next) => async (url, opts) => {
				if (!opts.retry && !globalOptions) return next(url, opts);

				const { retryUntil, delayTimer, maxAttempts } = {
					...defaultRetryOptions,
					...globalOptions,
					...opts.retry,
				};

				let attemptsMade = 0;

				const checkStatus = async (
					res?: Response,
					err?: unknown,
				): Promise<Response> => {
					const done = await Promise.resolve(retryUntil(res, err));

					if (done && res) return res;
					if (done && err) throw err;

					if (attemptsMade >= maxAttempts) {
						throw new MaxRetryAttemptsError(maxAttempts, res, { cause: err });
					}

					if (delayTimer) {
						await new Promise((res) => {
							setTimeout(res, delayTimer);
						});
					}

					const retryData = {
						attemptsMade,
						url,
						options: opts,
						error: err,
						res,
					};

					for (const callback of _onRetry) {
						await callback(retryData);
					}

					attemptsMade++;

					return await next(url, opts)
						.then(checkStatus, (error) => checkStatus(undefined, error));
				};

				return await next(url, opts)
					.then(checkStatus, (error) => checkStatus(undefined, error));
			});
	};
};
