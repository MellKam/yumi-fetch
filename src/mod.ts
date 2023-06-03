import { clientCore } from "./core.ts";
import {
  bodyResolvers,
  fetchMethods,
  jsonSerializer,
  queryAddon,
} from "./addons/mod.ts";

const yumi = clientCore
  .addon(fetchMethods)
  .addon(bodyResolvers())
  .addon(queryAddon)
  .addon(jsonSerializer());

export default yumi;

export * from "./addons/mod.ts";
export * from "./core.ts";
