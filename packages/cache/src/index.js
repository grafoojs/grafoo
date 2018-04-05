import { assign } from "@grafoo/util";

import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

function getPathId(path, pathArguments, variables) {
  return variables
    ? path +
        pathArguments.reduce((args, arg) => args + variables[arg], pathArguments.length ? ":" : "")
    : path;
}

export default function createCache(options) {
  options = options || {};
  const { initialState = {}, idFromProps = _ => _.id } = options;
  const { objectsMap = {}, pathsMap = {} } = initialState;
  const listeners = [];

  return {
    watch(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    write({ query: { paths }, variables }, data) {
      const objects = {};

      for (const path in paths) {
        const pathName = paths[path].root;
        const pathArguments = paths[path].args;
        const pathData = { [pathName]: data[pathName] };
        const pathObjects = mapObjects(pathData, idFromProps);

        assign(objects, pathObjects);

        pathsMap[getPathId(path, pathArguments, variables)] = {
          data: pathData,
          objects: pathObjects
        };
      }

      assign(objectsMap, objects);

      for (const i in listeners) {
        listeners[i](objects);
      }
    },
    read({ query: { paths }, variables }) {
      const data = {};
      const objects = {};

      for (const path in paths) {
        const pathName = paths[path].root;
        const pathArguments = paths[path].args;
        const currentPath = pathsMap[getPathId(path, pathArguments, variables)];

        if (currentPath) {
          data[pathName] = currentPath.data[pathName];

          for (const key in currentPath.objects) {
            objects[key] = currentPath.objects[key];
          }
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
