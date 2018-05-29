import {
  GraphQLRequestContext,
  GraphQlError,
  GraphQlPayload,
  Headers,
  TransportRequest
} from "@grafoo/types";
import { assign } from "@grafoo/util";

class TransportError extends Error {
  errors: GraphQlError[];

  constructor(errors: GraphQlError[], request: string) {
    super("graphql error on request " + request);
    this.errors = errors;
  }
}

export default function createTransport(uri: string, headers?: Headers): TransportRequest {
  headers = headers || {};

  return <T>(request: GraphQLRequestContext): Promise<T> => {
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
      .then(({ data, errors }: GraphQlPayload<T>) => {
        if (errors) throw new TransportError(errors, body);

        return data;
      });
  };
}
