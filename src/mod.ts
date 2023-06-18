import { clientCore } from "./core.ts";
import { bodyResolvers, httpMethods, json, query } from "./plugins/mod.ts";

/**
 * The default client, which we recommend, comes with several essential plugins that can greatly simplify your work.
 * Basically provides you with boilerplate code, saving you from having to manually include these plug-ins yourself.
 */
export const yumi = clientCore
  .withProperties(httpMethods())
  .withResolvers(bodyResolvers())
  .withPlugin(query())
  .withPlugin(json());

export type Yumi = typeof yumi;

export * from "./core.ts";
