const Err = Error;

export default function GraphQlError(errors, request) {
  Err.call(this);

  this.message = "graphql error on request " + JSON.stringify(request);
  this.errors = errors;

  if (Err.captureStackTrace) {
    Err.captureStackTrace(this, GraphQlError);
  }
}

(GraphQlError.prototype = Object.create(Err.prototype)).constructor = GraphQlError;
