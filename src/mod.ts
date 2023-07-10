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

export type BaseClientSelf = HTTPMethods<DefaultMethods>;
export type BaseClientRequestOptions = { query: QueryParams } & {
	json: unknown;
};
export type BaseClientResolvers = BodyResolvers<unknown>;
export type BaseClient =
	& Client<BaseClientSelf, BaseClientRequestOptions, BaseClientResolvers>
	& BaseClientSelf;

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
	type FetchMiddleware,
	type HTTPErrorCreator,
	type RequestOptions,
	type ResponsePromise,
} from "./core.ts";
export * from "./http_error.ts";
