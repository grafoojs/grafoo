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

export interface CacheWrite {
  (grafooObject: GrafooObject, variables: Variables, data: {}): void;
  (grafooObject: GrafooObject, data: {}): void;
}

export interface ClientInstance {
  request<T>(grafooObject: GrafooObject, variables?: Variables): Promise<T>;
  listen(listener: Listener): () => void;
  write: CacheWrite;
  read<T>(grafooObject: GrafooObject, variables?: Variables): { data?: T; objects?: ObjectsMap };
  flush(): InitialState;
}

export interface ClientOptions {
  initialState?: InitialState;
  idFields?: Array<string>;
  headers?: Headers;
}
