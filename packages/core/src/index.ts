import createTransport, { TransportRequest, Headers } from "@grafoo/transport/src";
import createCache, { CacheInstance, CacheOptions } from "@grafoo/cache/src";
import { assign } from "@grafoo/util";

export type ClientInstance = CacheInstance & { request: TransportRequest };

export type ClientOptions = CacheOptions & { headers: Headers };

export default function createClient(uri: string, options?: ClientOptions): ClientInstance {
  return assign({}, createCache(options), {
    request: createTransport(uri, options && options.headers)
  });
}
