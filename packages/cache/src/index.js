// @flow

import { assign } from "@grafoo/util";

import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

export type ObjectsMap = { [key: string]: { [key: string]: any } };

export type PathsMap = { [key: string]: { [key: string]: any } };

export type Variables = { [key: string]: any };

export type Listener = (objects: ObjectsMap) => void;

export type InitialState = { objectsMap: ObjectsMap, pathsMap: PathsMap };

export type CacheOptions = { initialState?: InitialState, idFromProps?: ({}) => string };

export type GrafooObject = { paths: { root: string, args: string[] } };

export type CacheRequest = { query: GrafooObject, variables?: Variables };

export type CacheInstance = {
  listen(listener: Listener): () => void,
  write(cacheRequest: CacheRequest, data: {}): void,
  read(cacheRequest: CacheRequest): { data: {}, objects: ObjectsMap } | null,
  flush(): InitialState
};

export default function createCache(options?: CacheOptions): CacheInstance {
  options = options || {};

  let { initialState, idFromProps } = options;

  initialState = initialState || {};
  idFromProps = idFromProps || (_ => _.id);

  let { objectsMap, pathsMap } = initialState;

  objectsMap = objectsMap || {};
  pathsMap = pathsMap || {};

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
    write(cacheRequest, data: {}) {
      const {
        query: { paths },
        variables
      } = cacheRequest;
      const objects: Object = {};

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

      for (let i = 0; i < listeners.length; i++) listeners[i](objects);
    },
    read({ query: { paths }, variables }) {
      const data = {};
      const objects: Object = {};

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

function getPathId(path: string, args: string[], variables?: Variables = {}) {
  let hasArgs = false;
  let finalPath = path;
  let i = args.length;

  while (i--) {
    if (args[i] in variables) {
      let v = variables[args[i]];
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
