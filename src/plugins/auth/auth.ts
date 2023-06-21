import { ClientPlugin } from "../../core.ts";
import { isHTTPError } from "../../http_error.ts";

export type AuthOptions = {
	/**
	 * Function that responsible for refreshing the token used for authorization.
	 * @returns Newly obtained token
	 */
	refreshToken: () => Promise<string> | string;
	/**
	 * This function is responsible for retrieving a token that has previously been saved or cached.
	 * @returns Raw saved token or `null` | `undefined` if no token was found.
	 */
	getSavedToken?: () =>
		| Promise<string | undefined | null>
		| string
		| undefined
		| null;
	/**
	 * @param token The raw token
	 * @returns The formatted string to be passed to the `Authorization` header.
	 *
	 * @default
	 * ```ts
	 * (token) => "Bearer " + token
	 * ```
	 */
	tokenFormatter?: (token: string) => string;
};

export const auth = (
	{
		getSavedToken,
		refreshToken,
		tokenFormatter = (token) => "Bearer " + token,
	}: AuthOptions,
): ClientPlugin => {
	return (client) => {
		return client.withMiddleware((next) => async (url, opts) => {
			let isTokenRefreshed = false;

			const setToken = async (useSavedToken: boolean) => {
				let token = useSavedToken && getSavedToken
					? await Promise.resolve(getSavedToken()).catch()
					: null;

				if (!token) {
					isTokenRefreshed = true;
					token = await Promise.resolve(refreshToken());
				}

				opts.headers.set("Authorization", tokenFormatter(token));
			};

			await setToken(true);

			try {
				return await next(url, opts);
			} catch (err) {
				if (
					isHTTPError(err) && err.status === 401 && !isTokenRefreshed
				) {
					await setToken(false);
					return await next(url, opts);
				}
				throw err;
			}
		});
	};
};
