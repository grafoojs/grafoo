import { assign } from "../util";
import TransportError from "./TransportError";

export default function createTransport(uri, fetchOptions = { headers: {} }) {
  var prehook, posthook;

  return {
    request(request) {
      var context = assign({ headers: fetchOptions.headers }, request);

      if (prehook) context = assign({}, context, prehook(context));

      var { headers, query: { query }, variables } = context;

      var options = assign({ body: JSON.stringify({ query, variables }) }, fetchOptions, {
        method: "POST",
        headers: assign({}, headers, { "Content-Type": "application/json" })
      });

      var response, result;

      return fetch(uri, options)
        .then(res => {
          response = res;

          var contentType = response.headers.get("Content-Type");

          return contentType && contentType.startsWith("application/json")
            ? response.json()
            : response.text();
        })
        .then(res => {
          result = res;

          if (posthook) ({ response, result } = posthook({ response, result }));

          if (response.ok && !(result.error || result.errors) && result.data) {
            return result.data;
          } else {
            var errorResult = "string" == typeof result ? { error: result } : result;

            throw new TransportError(assign({ status: response.status }, errorResult), {
              query,
              variables
            });
          }
        });
    },
    pre(fn) {
      prehook = fn;
    },
    post(fn) {
      prehook = fn;
    }
  };
}
