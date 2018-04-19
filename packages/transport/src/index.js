import { assign } from "@grafoo/util";

import GraphQlError from "./graphql-error";

export default function createTransport(uri, options) {
  options = options || {};

  return request => {
    const init = options.call ? options() : options;

    assign(init, {
      body: JSON.stringify(request),
      method: "POST",
      headers: assign({ "Content-Type": "application/json" }, init.headers)
    });

    return fetch(uri, init)
      .then(res => res.json())
      .then(({ data, errors }) => {
        if (errors) throw new GraphQlError(errors, request);

        return data;
      });
  };
}
