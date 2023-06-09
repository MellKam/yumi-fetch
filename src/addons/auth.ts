import { Addon } from "../core.ts";

export type AuthOptions = {
  refreshToken: () => Promise<string> | string;
  getStoredToken: () =>
    | Promise<string | undefined | null>
    | string
    | undefined
    | null;
  tokenFormatter?: (token: string) => string;
  onUnauthorized?: (req: Request) => void | Promise<void>;
};

export const auth = (
  {
    getStoredToken,
    refreshToken,
    tokenFormatter = (token) => "Bearer " + token,
    onUnauthorized,
  }: AuthOptions,
): Addon =>
(client) => {
  client.addMiddleware((next) => async (req) => {
    let isTokerRefreshed = false;

    const _refresh = async () => {
      try {
        const token = await Promise.resolve(refreshToken());
        isTokerRefreshed = true;
        return token;
      } catch (error) {
        if (onUnauthorized) await onUnauthorized(req);
        throw new Error("Failed to refresh token", { cause: error });
      }
    };

    const token = await Promise.resolve(getStoredToken())
      .then(
        (token) => {
          return token ? token : _refresh();
        },
        _refresh,
      );

    req.headers.set("Authorization", tokenFormatter(token));

    try {
      return await next(req);
    } catch (error) {
      if (error.status === 401 && !isTokerRefreshed) {
        const token = await _refresh();
        req.headers.set("Authorization", tokenFormatter(token));

        return await next(req);
      }
      throw error;
    }
  });

  return client;
};
