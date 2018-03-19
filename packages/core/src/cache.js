import { buildQueryTree, mapObjects, mergeObjects } from "./util";

export default function createCache(initialState = {}) {
  let objectsMap = initialState.objectsMap || {};
  const pathsMap = initialState.pathsMap || {};
  const listeners = [];

  return {
    watch(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    write(query, data) {
      const objects = mapObjects(data);

      objectsMap = mergeObjects(objectsMap, objects);

      pathsMap[query] = { data, objects };

      for (let i = 0; i < listeners.length; i++) listeners[i](objects);
    },
    read(query) {
      const operation = pathsMap[query];

      if (!operation) return null;

      const { data, objects } = operation;

      return { data: buildQueryTree(data, objectsMap), objects };
    }
  };
}
