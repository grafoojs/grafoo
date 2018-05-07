import { TransportRequest, Headers } from "@grafoo/transport";
import { CacheInstance, CacheOptions } from "@grafoo/cache";

export type ClientInstance = CacheInstance & { request: TransportRequest };

export type ClientOptions = CacheOptions & { headers: Headers };

export default function createClient(uri: string, options?: ClientOptions): ClientInstance;
