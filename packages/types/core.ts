import { CacheOptions, CacheInstance } from "./cache";
import { Variables } from "./transport";
import { GrafooObject } from "./tag";

export interface ClientInstance extends CacheInstance {
  request<T>(grafooObject: GrafooObject, variables?: Variables): Promise<T>;
}

export interface ClientOptions extends CacheOptions {
  headers: Headers;
}
