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

export type BaseSelf = HTTPMethods<DefaultMethods>;
export type BaseRequestOptions = { query: QueryParams } & {
	json: unknown;
};
export type BaseResolvers = BodyResolvers<unknown>;
export type BaseClient =
	& Client<BaseSelf, BaseRequestOptions, BaseResolvers>
	& BaseSelf;

/**
 * The default client, which we recommend, comes with several essential plugins that can greatly simplify your work.
 * Basically provides you with boilerplate code, saving you from having to manually include these plug-ins yourself.
 */
export const yumi = clientCore
	.withProperties(httpMethods())
	.withResolvers(bodyResolvers())
	.withPlugin(querySerializer())
	.withPlugin(jsonSerializer()) as BaseClient;

export {
	type Client,
	clientCore,
	type ClientPlugin,
	type FetchLike,
	type FetchLikeOptions,
	type FetchMiddleware,
	type HTTPErrorCreator,
	type ResponsePromise,
} from "./core.ts";
export * from "./http_error.ts";
