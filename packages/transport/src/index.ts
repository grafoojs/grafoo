import { GraphQlError, GraphQlPayload, Headers, TransportRequest, Variables } from "@grafoo/types";

class TransportError extends Error {
  errors: GraphQlError[];

  constructor(errors: GraphQlError[], request: string) {
    super("graphql error on request " + request);
    this.errors = errors;
  }
}

export default function createTransport(uri: string, headers?: Headers): TransportRequest {
  headers = headers || {};

  return <T>(query: string, variables?: Variables): Promise<T> => {
    let body = JSON.stringify({ query, variables });
    let init = {
      body,
      method: "POST",
      headers: Object.assign(
        { "Content-Type": "application/json" },
        typeof headers == "function" ? headers() : headers
      )
    };

    return fetch(uri, init)
      .then(res => res.json())
      .then(({ data, errors }: GraphQlPayload<T>) => {
        if (errors) throw new TransportError(errors, body);

        return data;
      });
  };
}
