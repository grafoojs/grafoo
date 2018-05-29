import { CacheInstance, CacheOptions, ObjectsMap, Variables } from "@grafoo/types";
import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

export default function createCache(options?: CacheOptions): CacheInstance {
  options = options || {};

  const { initialState = { objectsMap: {}, pathsMap: {} }, idFields = ["id"] } = options;

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
        const { name, args } = paths[path];
        const pathData = { [name]: data[name] };
        const pathObjects = mapObjects(pathData, idFields);

        Object.assign(objects, pathObjects);

        pathsMap[getPathId(path, args, variables)] = {
          data: pathData,
          objects: pathObjects
        };
      }

      for (const i in objects)
        objectsMap[i] = objects[i] = Object.assign({}, objectsMap[i], objects[i]);

      for (const listener of listeners) listener(objects);
    },
    read({ query: { paths }, variables }) {
      const data = {};
      const objects: ObjectsMap = {};

      for (const path in paths) {
        const { name, args } = paths[path];
        const currentPath = pathsMap[getPathId(path, args, variables)];

        if (currentPath) {
          data[name] = currentPath.data[name];

          for (const i in currentPath.objects) objects[i] = currentPath.objects[i];
        }
      }

      if (!Object.keys(data).length) return {};

      return { data: buildQueryTree(data, objectsMap, idFields), objects };
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
