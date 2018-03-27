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
    write(request, data) {
      var objects = mapObjects(data, idFromProps);

      objectsMap = mergeObjects(objectsMap, objects);

      pathsMap[request.query.query] = { data, objects };

      for (var i = 0; i < listeners.length; i++) listeners[i](objects);
    },
    read(request) {
      var operation = pathsMap[request.query.query];

      if (!operation) return null;

      var { data, objects } = operation;

      return { data: buildQueryTree(data, objectsMap, idFromProps), objects };
    },
    getState() {
      return { objectsMap, pathsMap };
    }
  };
}
