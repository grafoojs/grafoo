import { CacheOptions, CacheInstance } from "./cache";
import { TransportRequest } from "./transport";

export interface ClientInstance extends CacheInstance {
  request: TransportRequest;
}

export interface ClientOptions extends CacheOptions {
  headers: Headers;
}
