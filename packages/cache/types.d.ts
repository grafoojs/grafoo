export type ObjectsMap = { [key: string]: { [key: string]: any } };

export type PathsMap = { [key: string]: { [key: string]: any } };

export type Variables = { [key: string]: any };

export type Listener = (objects: ObjectsMap) => void;

export type InitialState = { objectsMap: ObjectsMap; pathsMap: PathsMap };

export type CacheOptions = { initialState?: InitialState; idFromProps?: ({}) => string };

export type GrafooObject = { paths: { root: string; args: string[] } };

export type CacheRequest = { query: GrafooObject; variables?: Variables };

export type CacheInstance = {
  listen(listener: Listener): () => void;
  write(cacheRequest: CacheRequest, data: {}): void;
  read(cacheRequest: CacheRequest): { data: {}; objects: ObjectsMap } | null;
  flush(): InitialState;
};

export default function createCache(options?: CacheOptions): CacheOptions;
