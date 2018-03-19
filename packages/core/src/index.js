import { assign } from "./util";

import createCache from "./cache";
import createTransport from "./transport";

export default function createClient(uri, options = {}) {
  let transport = createTransport(uri, options.fetchOptions);
  let cache = createCache(options.initialState);

  return assign({}, transport, cache);
}
