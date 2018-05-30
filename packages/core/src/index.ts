import createCache from "@grafoo/cache";
import createTransport from "@grafoo/transport";
import { ClientInstance, ClientOptions } from "@grafoo/types";

export default function createClient(uri: string, options?: ClientOptions): ClientInstance {
  return Object.assign({}, createCache(options), {
    request: createTransport(uri, options && options.headers)
  });
}
