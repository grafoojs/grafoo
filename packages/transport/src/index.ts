import { GraphQlError, GraphQlPayload, TransportRequest, Variables } from "@grafoo/types";

class TransportError extends Error {
  errors: GraphQlError[];

  constructor(errors: GraphQlError[], request: string) {
    super("graphql error on request " + request);
    this.errors = errors;
  }
}

export default function createTransport(
  uri: string,
  options?: RequestInit | (() => RequestInit)
): TransportRequest {
  return <T>(query: string, variables?: Variables): Promise<T> => {
    options = typeof options == "function" ? options() : options || {};

    let body = JSON.stringify({ query, variables });
    let init = Object.assign(options, {
      body,
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, options.headers)
    });

    return fetch(uri, init)
      .then(res => res.json())
      .then(({ data, errors }: GraphQlPayload<T>) => {
        if (errors) throw new TransportError(errors, body);

        return data;
      });
  };
}
