import { assign } from "@grafoo/util";

const Err = Error;

export default function GraphQlError(errors, request) {
  Err.call(this);

  assign(this, { message: "graphql error on request " + JSON.stringify(request), errors });

  if (Err.captureStackTrace) Err.captureStackTrace(this, GraphQlError);
}

(GraphQlError.prototype = Object.create(Err.prototype)).constructor = GraphQlError;
