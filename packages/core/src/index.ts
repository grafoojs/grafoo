import createTransport, { TransportRequest, Headers } from "@grafoo/transport";
import createCache, { CacheInstance, CacheOptions } from "@grafoo/cache";
import { assign } from "@grafoo/util";

export interface ClientInstance extends CacheInstance {
  request: TransportRequest;
}

export interface ClientOptions extends CacheOptions {
  headers: Headers;
}

export default function createClient(uri: string, options?: ClientOptions): ClientInstance {
  return assign({}, createCache(options), {
    request: createTransport(uri, options && options.headers)
  });
}
