import { assign } from "./util";

import createCache from "./cache";
import createTransport from "./transport";

export default function createClient(uri, options = {}) {
  const transport = createTransport(uri, options.fetchOptions);
  const cache = createCache(options.initialState, options.idFromProps);

  return assign({}, transport, cache);
}
