export default function GraphQlError(errors, request) {
  Error.call(this);

  this.message = "graphql error on request " + JSON.stringify(request);
  this.errors = errors;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, GraphQlError);
  }
}

(GraphQlError.prototype = Object.create(Error.prototype)).constructor = GraphQlError;
