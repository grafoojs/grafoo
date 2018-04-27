import { assign } from "@grafoo/util";

const Err = Error;

export default function TransportError(errors, request) {
  Err.call(this);

  assign(this, { message: "graphql error on request " + request, errors });

  if (Err.captureStackTrace) Err.captureStackTrace(this, TransportError);
}

(TransportError.prototype = Object.create(Err.prototype)).constructor = TransportError;
