import { clientCore } from "./core.ts";
import {
  auth,
  bodyResolvers,
  fetchMethods,
  jsonSerializer,
  querySerializer,
} from "./addons/mod.ts";

/**
 * The default client we recommend comes with a few essential add-ons that can greatly simplify your experience.
 * Basically, provides you with boilerplate code, eliminating the need for you to manually include these add-ons yourself.
 */
export const yumi = clientCore
  .addon(fetchMethods)
  .addon(bodyResolvers())
  .addon(querySerializer)
  .addon(jsonSerializer())
  .addon(auth({
    getStoredToken: () => {
      return "Stored token";
    },
    refreshToken: () => {
      return "Refreshed token";
    },
    tokenFormatter: (token) => `Bearer ${token}`,
    onUnauthorized: () => {
      // ask user to relogin
    },
  }));

export type Yumi = typeof yumi;

export * from "./core.ts";
export * from "./addons/mod.ts";
