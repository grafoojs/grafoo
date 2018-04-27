export declare type GraphQLRequestContext = { query: string; variables?: { [key: string]: any } };

export declare type Headers = () => Object | Object;

export declare type TransportPayload = { [key: string]: any };

export declare type TransportRequest = (
  request: {
    query: string;
    variables?: { [key: string]: any };
  }
) => Promise<{ [key: string]: any }>;

export declare type Variables = { [key: string]: any };

export default function createTransport(
  uri: string,
  headers?: () => Object | Object
): (
  request: { query: string; variables?: { [key: string]: any } }
) => Promise<{
  [key: string]: any;
}>;
