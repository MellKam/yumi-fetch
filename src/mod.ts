import { clientCore } from "./core.ts";
import {
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
  .addon(jsonSerializer());

export type Yumi = typeof yumi;

export * from "./addons/mod.ts";
export * from "./core.ts";
