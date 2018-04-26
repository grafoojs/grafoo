export interface ObjectsMap {
  [key: string]: object;
}

export interface PathsMap {
  [key: string]: object;
}

export interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export interface CacheOptions {
  initialState?: object;
  idFromProps: (object) => string;
}

export declare type Listener = (ObjectsMap) => void;

export interface CacheRequest {
  query: { paths: { root: string; args: string[] } };
  variables?: object;
}

export interface CacheObject {
  listen: (Listener) => () => void;
  write: (CacheRequest, object) => void;
  read: (CacheRequest) => { data: {}; objects: ObjectsMap };
  flush: () => InitialState;
}

export default function createCache(options?: CacheOptions): CacheObject;
