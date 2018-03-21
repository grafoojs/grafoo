import { assign, queryID } from "./util";

function ClientError(response, request) {
  var msg;

  try {
    msg = response.errors[0].message;
  } catch (e) {
    msg = `GraphQL Error (Code: ${response.status})`;
  }

  Error.call(this, `${msg}: ${JSON.stringify({ response, request })}`);

  this.response = response;
  this.request = request;

  if ("function" == typeof Error.captureStackTrace) {
    Error.captureStackTrace(this, ClientError);
  }
}

(ClientError.prototype = Object.create(Error.prototype)).contructor = ClientError;

export default function createTransport(uri, fetchOptions = { headers: {} }) {
  var prehook, posthook, tempRequestID;

  return {
    request(request) {
      /* Assures that equal requests are not fired at the same time */
      var requestID = queryID(request.query, request.variables);
      if (tempRequestID == requestID) return;
      else tempRequestID = requestID;

      var context = assign({ headers: fetchOptions.headers }, request);

      if (prehook) context = assign({}, context, prehook(context));

      var { headers, query, variables } = context;

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

          if (response.ok && !result.errors && result.data) {
            return result.data;
          } else {
            var errorResult = "string" == typeof result ? { error: result } : result;

            throw new ClientError(assign({ status: response.status }, errorResult), {
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
