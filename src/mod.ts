import { clientCore } from "./core.ts";
import {
  bodyResolvers,
  errorHandler,
  fetchMethods,
  jsonSerializer,
  querySerializer,
} from "./addons/mod.ts";

const _yumi = clientCore
  .addon(fetchMethods)
  .addon(bodyResolvers())
  .addon(querySerializer)
  .addon(jsonSerializer())
  .addon(errorHandler);

export type Yumi = typeof _yumi;

/**
 * The default client we recommend comes with a few essential add-ons that can greatly simplify your experience.
 * Basically, provides you with boilerplate code, eliminating the need for you to manually include these add-ons yourself.
 */
export const yumi = _yumi as Yumi;

export * from "./addons/mod.ts";
export * from "./core.ts";
