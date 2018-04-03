import createTransport from "@grafoo/transport";
import createCache from "@grafoo/cache";
import { assign } from "@grafoo/util";

export default function createClient(uri, options = {}) {
  const transport = createTransport(uri, options.fetchOptions);
  const cache = createCache(options.initialState, options.idFromProps);

  return assign({}, transport, cache);
}
