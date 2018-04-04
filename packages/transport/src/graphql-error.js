export default function GraphQlError(errors, request) {
  Error.call(this);

  this.message = "GraphQlError: on request " + JSON.stringify(request);
  this.errors = errors;

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, GraphQlError);
  }
}

(GraphQlError.prototype = Object.create(Error.prototype)).constructor = GraphQlError;
