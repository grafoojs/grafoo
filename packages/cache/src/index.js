import { assign } from "@grafoo/util";

import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";

function getPathId(path, args, variables) {
  const hasArgs = args.length && variables && args.some(arg => variables[arg]);

  return hasArgs ? path + args.reduce((args, arg) => args + variables[arg], ":") : path;
}

export default function createCache(options = {}) {
  const { initialState = {}, idFromProps = _ => _.id } = options;
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
    write(
      {
        query: { paths },
        variables
      },
      data
    ) {
      const objects = {};

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

      for (const i in listeners) listeners[i](objects);
    },
    read({ query: { paths }, variables }) {
      const data = {};
      const objects = {};

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
