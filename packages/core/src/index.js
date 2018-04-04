import createTransport from "@grafoo/transport/src";
import createCache from "@grafoo/cache/src";
import { assign } from "@grafoo/util";

export default function createClient(uri, options = {}) {
  return assign(
    createTransport(uri, options.fetchOptions),
    createCache(options.initialState, options.idFromProps)
  );
}
