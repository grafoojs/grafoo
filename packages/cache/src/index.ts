import { GrafooObject } from "@grafoo/tag";
import { assign } from "@grafoo/util";
import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

export interface ObjectsMap {
  [key: string]: { [key: string]: any };
}

export interface PathsMap {
  [key: string]: { [key: string]: any };
}

export interface Variables {
  [key: string]: any;
}

export type Listener = (objects: ObjectsMap) => void;

export interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export type IdFromPropsFn = (data: { [key: string]: any }) => string;

export interface CacheOptions {
  initialState?: InitialState;
  idFromProps?: IdFromPropsFn;
}

export interface CacheRequest {
  query: GrafooObject;
  variables?: Variables;
}

export interface CacheInstance {
  listen(listener: Listener): () => void;
  write(cacheRequest: CacheRequest, data: {}): void;
  read(cacheRequest: CacheRequest): { data: {}; objects: ObjectsMap } | null;
  flush(): InitialState;
}

export default function createCache(options?: CacheOptions): CacheInstance {
  options = options || {};

  const { initialState = { objectsMap: {}, pathsMap: {} }, idFromProps = _ => _.id } = options;

  const { objectsMap = {}, pathsMap = {} } = initialState;

  const listeners = [];

  return {
    listen(listener) {
      listeners.push(listener);

      return () => {
        const index = listeners.indexOf(listener);

        if (index < 0) return;

        listeners.splice(index, 1);
      };
    },
    write({ query: { paths }, variables }, data: {}) {
      const objects: ObjectsMap = {};

      for (const path in paths) {
        const { root, args } = paths[path];
        const pathData = { [root]: data[root] };
        const pathObjects = mapObjects(pathData, idFromProps);

        assign(objects, pathObjects);

        pathsMap[getPathId(path, args, variables)] = {
          data: pathData,
          objects: pathObjects
        };
      }

      for (const i in objects) objectsMap[i] = objects[i] = assign({}, objectsMap[i], objects[i]);

      for (const listener of listeners) listener(objects);
    },
    read({ query: { paths }, variables }) {
      const data = {};
      const objects: ObjectsMap = {};

      for (const path in paths) {
        const { root, args } = paths[path];
        const currentPath = pathsMap[getPathId(path, args, variables)];

        if (currentPath) {
          data[root] = currentPath.data[root];

          for (const i in currentPath.objects) objects[i] = currentPath.objects[i];
        }
      }

      if (!Object.keys(data).length) return null;

      return { data: buildQueryTree(data, objectsMap, idFromProps), objects };
    },
    flush() {
      return { objectsMap, pathsMap };
    }
  };
}

function getPathId(path: string, args: string[], variables?: Variables) {
  variables = variables || {};
  let hasArgs = false;
  let finalPath = path;
  let i = args.length;

  while (i--) {
    if (args[i] in variables) {
      const v = variables[args[i]];

      if (!hasArgs) {
        finalPath += ":" + v;
      } else {
        finalPath += v;
        hasArgs = true;
      }
    }
  }

  return finalPath;
}
