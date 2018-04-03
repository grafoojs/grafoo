import createTransport from "@grafoo/transport/src";
import createCache from "@grafoo/cache/src";
import { assign } from "@grafoo/util/src";

export default function createClient(uri, options = {}) {
  const transport = createTransport(uri, options.fetchOptions);
  const cache = createCache(options.initialState, options.idFromProps);

  return assign({}, transport, cache);
}
