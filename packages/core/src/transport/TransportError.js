export default class TransportError extends Error {
  constructor(response, request) {
    var msg;

    try {
      msg = response.error || response.errors[0].message;
    } catch (e) {
      msg = `(Code: ${response.status})`;
    }

    super(`GraphQL Error: ${msg}; request: ${JSON.stringify({ response, request })}`);

    this.response = response;
    this.request = request;

    if (typeof Error.captureStackTrace == "function") {
      Error.captureStackTrace(this, TransportError);
    }
  }
}
