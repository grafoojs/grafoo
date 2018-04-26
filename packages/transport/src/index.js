// @flow

import { assign } from "@grafoo/util";

import GraphQlError from "./graphql-error";

export interface Variables {
  [key: string]: any;
}

export interface GraphQLRequestContext {
  query: string;
  variables?: Variables;
}

export default function createTransport(uri: string, headers?: {} | (() => {})) {
  headers = headers || {};

  return (request: GraphQLRequestContext) => {
    const init = {
      body: JSON.stringify(request),
      method: "POST",
      headers: assign(
        { "Content-Type": "application/json" },
        typeof headers == "function" ? headers() : headers
      )
    };

    return fetch(uri, init)
      .then(res => res.json())
      .then(({ data, errors }) => {
        if (errors) throw new GraphQlError(errors, request);

        return data;
      });
  };
}
