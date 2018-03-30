import buildQueryTree from "./util/buildQueryTree";
import mapObjects from "./util/mapObjects";
import { assign } from "./util";

export default function createCache(initialState = {}, idFromProps = _ => _.id) {
  const objectsMap = initialState.objectsMap || {};
  const pathsMap = initialState.pathsMap || {};
  const listeners = [];

  return {
    watch(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    write({ query: { paths } }, data) {
      const objects = {};

      for (const path in paths) {
        const pathData = data[paths[path].root];
        const pathObjects = mapObjects(pathData, idFromProps);

        assign(objects, pathObjects);

        pathsMap[path] = { data: pathData, objects: pathObjects };
      }

      assign(objectsMap, objects);

      for (const id in objectsMap) {
        objectsMap[id] = assign(objectsMap[id], objects[id]);
      }

      for (const i in listeners) {
        listeners[i](objects);
      }
    },
    read({ query: { paths } }) {
      const data = {};
      const objects = {};

      for (const path in paths) {
        const currentPath = pathsMap[path];

        if (currentPath) {
          data[paths[path].root] = currentPath.data;

          for (const key in currentPath.objects) {
            objects[key] = currentPath.objects[key];
          }
        }
      }

      if (!Object.keys(data).length) return null;

      return { data: buildQueryTree(data, objectsMap, idFromProps), objects };
    },
    getState() {
      return { objectsMap, pathsMap };
    }
  };
}
