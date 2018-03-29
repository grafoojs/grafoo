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
      var { query: { paths } } = request,
        objects = {};

      for (var path in paths) {
        var pathObjects = mapObjects(data[paths[path].root], idFromProps);

        objects = Object.assign(objects, pathObjects);
        pathsMap[path] = { data: data[paths[path].root], objects: pathObjects };
      }

      objectsMap = mergeObjects(objectsMap, objects);

      for (var i = 0; i < listeners.length; i++) listeners[i](objects);
    },
    read(request) {
      var { query: { paths } } = request,
        operation = { data: {}, objects: {} };

      for (var path in paths) {
        var currentPath = pathsMap[path];
        if (currentPath) {
          operation.data[paths[path].root] = currentPath.data;
          for (var key in currentPath.objects) {
            operation.objects[key] = currentPath.objects[key];
          }
        }
      }

      if (!Object.keys(operation.data).length) return null;

      var { data, objects } = operation;

      return { data: buildQueryTree(data, objectsMap, idFromProps), objects };
    },
    getState() {
      return { objectsMap, pathsMap };
    }
  };
}
