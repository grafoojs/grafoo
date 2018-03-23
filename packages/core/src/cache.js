import { buildQueryTree, mapObjects, mergeObjects } from "./util";

export default function createCache(initialState = {}, idFromProps = _ => _.id) {
  var objectsMap = initialState.objectsMap || {},
    pathsMap = initialState.pathsMap || {},
    listeners = [];

  return {
    watch(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    write(query, data) {
      var objects = mapObjects(data, idFromProps);

      objectsMap = mergeObjects(objectsMap, objects);

      pathsMap[query] = { data, objects };

      for (var i = 0; i < listeners.length; i++) listeners[i](objects);
    },
    read(query) {
      var operation = pathsMap[query];

      if (!operation) return null;

      var { data, objects } = operation;

      return {
        data: buildQueryTree(data, objectsMap, idFromProps),
        objects
      };
    }
  };
}
