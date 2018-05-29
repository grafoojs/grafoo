import { Variables } from "./transport";
import { GrafooObject } from "./tag";

export interface ObjectsMap {
  [key: string]: { [key: string]: any };
}

export interface PathsMap {
  [key: string]: { [key: string]: any };
}

export type Listener = (objects: ObjectsMap) => void;

export interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export interface CacheOptions {
  initialState?: InitialState;
  idFields?: Array<string>;
}

export interface CacheRequest {
  query: GrafooObject;
  variables?: Variables;
}

export interface CacheInstance {
  listen(listener: Listener): () => void;
  write<T>(cacheRequest: CacheRequest, data: T): void;
  read<T>(cacheRequest: CacheRequest): { data?: T; objects?: ObjectsMap };
  flush(): InitialState;
}
