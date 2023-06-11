import { Addon } from "../core.ts";

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
): Addon => {
  return (client) => {
    client.addMiddleware((next) => async (req) => {
      let isTokenRefreshed = false;

      const setToken = async (useSavedToken: boolean) => {
        let token = useSavedToken && getSavedToken
          ? await Promise.resolve(getSavedToken()).catch()
          : null;

        if (!token) {
          isTokenRefreshed = true;
          token = await Promise.resolve(refreshToken())
            .catch((err) => {
              throw new Error("Failed to refresh token", { cause: err });
            });
        }

        req.headers.set("Authorization", tokenFormatter(token));
      };

      await setToken(true);

      try {
        return await next(req);
      } catch (err) {
        if (
          typeof err === "object" && err !== null && "status" in err &&
          err.status === 401 && !isTokenRefreshed
        ) {
          await setToken(false);
          return await next(req);
        }
        throw err;
      }
    });

    return client;
  };
};
