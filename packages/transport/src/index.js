// @flow

import { assign } from "@grafoo/util";

import TransportError from "./error";

export type Variables = { [key: string]: any };

export type GraphQLRequestContext = { query: string, variables?: Variables };

export type TransportPayload = { [key: string]: any };

export type TransportRequest = (request: GraphQLRequestContext) => Promise<TransportPayload>;

export type Headers = (() => Object) | Object;

export default function createTransport(uri: string, headers?: Headers): TransportRequest {
  headers = headers || {};

  return (request: GraphQLRequestContext): Promise<TransportPayload> => {
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
      .then(({ data, errors }) => {
        if (errors) throw new TransportError(errors, body);

        return data;
      });
  };
}
