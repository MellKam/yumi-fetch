import { Client, clientCore } from "./core.ts";
import {
	BodyResolvers,
	bodyResolvers,
	DefaultMethods,
	HTTPMethods,
	httpMethods,
	jsonSerializer,
	QueryParams,
	querySerializer,
} from "./plugins/mod.ts";

export type Yumi =
	& Client<YumiSelf, YumiRequestOptions, YumiResolvers>
	& YumiSelf;
export type YumiSelf = HTTPMethods<DefaultMethods>;
export type YumiRequestOptions = { query: QueryParams } & { json: unknown };
export type YumiResolvers = BodyResolvers<unknown>;

/**
 * The default client, which we recommend, comes with several essential plugins that can greatly simplify your work.
 * Basically provides you with boilerplate code, saving you from having to manually include these plug-ins yourself.
 */
export const yumi = clientCore
	.withProperties(httpMethods())
	.withResolvers(bodyResolvers())
	.withPlugin(querySerializer())
	.withPlugin(jsonSerializer()) as Yumi;

export {
	type Client,
	clientCore,
	type ClientPlugin,
	type FetchLike,
	type FetchMiddleware,
	type HTTPErrorCreator,
	type RequestOptions,
	type ResponsePromise,
} from "./core.ts";
export * from "./http_error.ts";
