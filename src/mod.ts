import { clientCore } from "./core.ts";
import { bodyMethodsAddon, httpMethodsAddon } from "./addons/mod.ts";

const yumi = clientCore
  .addon(bodyMethodsAddon)
  .addon(httpMethodsAddon);

export default yumi;

export * from "./addons/mod.ts";
export * from "./core.ts";
