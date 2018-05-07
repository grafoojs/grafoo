export type Variables = { [key: string]: any };

export type GraphQLRequestContext = { query: string; variables?: Variables };

export type TransportPayload = { [key: string]: any };

export type TransportRequest = (request: GraphQLRequestContext) => Promise<TransportPayload>;

export type Headers = (() => Object) | Object;

export default function createTransport(uri: string, headers?: Headers): TransportRequest;
