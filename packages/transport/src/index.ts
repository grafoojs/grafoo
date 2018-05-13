import { assign } from "@grafoo/util";

export type GraphQlError = {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
};

class TransportError extends Error {
  public errors: GraphQlError[];

  constructor(errors: GraphQlError[], request: string) {
    super("graphql error on request " + request);
    this.errors = errors;
  }
}

export type GraphQlPayload = { data: { [key: string]: any }; errors?: GraphQlError[] };

export type Variables = { [key: string]: any };

export type GraphQLRequestContext = { query: string; variables?: Variables };

export type TransportRequest = (request: GraphQLRequestContext) => Promise<{}>;

export type Headers = (() => {}) | {};

export default function createTransport(uri: string, headers?: Headers): TransportRequest {
  headers = headers || {};

  return (request: GraphQLRequestContext): Promise<{}> => {
    const body = JSON.stringify(request);
    const init = {
      body,
      method: "POST",
      headers: assign(
        { "Content-Type": "application/json" },
        typeof headers == "function" ? headers() : headers
      )
    };

    return fetch(uri, init)
      .then(res => res.json())
      .then(({ data, errors }: GraphQlPayload) => {
        if (errors) throw new TransportError(errors, body);

        return data;
      });
  };
}
