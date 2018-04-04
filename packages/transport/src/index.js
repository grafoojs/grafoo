import { assign } from "@grafoo/util";

import GraphQlError from "./graphql-error";

export default function createTransport(uri, fetchOptions = {}) {
  return {
    request(request) {
      const init = typeof fetchOptions === "function" ? fetchOptions() : fetchOptions;

      const options = assign({ body: JSON.stringify(request) }, init, {
        method: "POST",
        headers: assign({ "Content-Type": "application/json" }, init.headers)
      });

      return fetch(uri, options)
        .then(res => res.json())
        .then(({ data, errors }) => {
          if (errors) throw new GraphQlError(errors, request);

          return data;
        });
    }
  };
}
