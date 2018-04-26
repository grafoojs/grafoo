// @flow

import { assign } from "@grafoo/util";

import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

export type ObjectsMap = { [key: string]: { [key: string]: any } };

export type PathsMap = { [key: string]: { [key: string]: any } };

export type Variables = { [key: string]: any };

export type Listener = ObjectsMap => void;

export interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export interface CacheOptions {
  initialState?: InitialState;
  idFromProps?: ({}) => string;
}

export interface CacheRequest {
  query: { paths: { root: string, args: string[] } };
  variables: Variables;
}

export interface CacheObject {
  listen: Listener => () => void;
  write: (CacheRequest, {}) => void;
  read: CacheRequest => { data: {}, objects: ObjectsMap } | null;
  flush: () => InitialState;
}

function getPathId(path: string, args: string[], variables: Variables) {
  const hasArgs = args.length && variables ? args.some(arg => variables[arg]) : false;

  return hasArgs ? path + args.reduce((args, arg) => args + variables[arg], ":") : path;
}

export default function createCache(options?: CacheOptions) {
  options = options || {};

  let { initialState, idFromProps } = options;

  initialState = initialState || {};
  idFromProps = idFromProps || (_ => _.id);

  let { objectsMap, pathsMap } = initialState;

  objectsMap = objectsMap || {};
  pathsMap = pathsMap || {};

  const listeners = [];

  return {
    listen(listener: Listener): () => void {
      listeners.push(listener);

      return () => {
        const index = listeners.indexOf(listener);

        if (index < 0) return;

        listeners.splice(index, 1);
      };
    },
    write(cacheRequest: CacheRequest, data: {}) {
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
    read({ query: { paths }, variables }: CacheRequest): { data: {}, objects: ObjectsMap } | null {
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
    flush(): InitialState {
      return { objectsMap, pathsMap };
    }
  };
}
