import createTransport from "@grafoo/transport";
import {
  ClientInstance,
  ClientOptions,
  GrafooObject,
  Listener,
  ObjectsMap,
  Variables
} from "@grafoo/types";
import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";
import { getPathId } from "./util";

export default function createClient(uri: string, options?: ClientOptions): ClientInstance {
  let { initialState, idFields } = options;
  let { pathsMap, objectsMap } = initialState || { pathsMap: {}, objectsMap: {} };
  let listeners: Listener[] = [];
  let transportRequest = createTransport(uri, options && options.headers);

  function request<T>({ query, frags }: GrafooObject, variables?: Variables) {
    if (frags) for (let frag in frags) query += frags[frag];

    return transportRequest<T>(query, variables);
  }

  function listen(listener: Listener) {
    listeners.push(listener);

    return () => {
      let index = listeners.indexOf(listener);

      if (index < 0) return;

      listeners.splice(index, 1);
    };
  }

  function write({ paths }: GrafooObject, variables: Variables | {}, data?: {}) {
    data = data || variables;

    let objects: ObjectsMap = {};

    for (let path in paths) {
      let { name, args } = paths[path];
      let pathData = { [name]: data[name] };
      let pathObjects = mapObjects(pathData, idFields);

      Object.assign(objects, pathObjects);

      pathsMap[getPathId(path, args, variables)] = { data: pathData, objects: pathObjects };
    }

    for (let i in objects) {
      objectsMap[i] = objects[i] = Object.assign({}, objectsMap[i], objects[i]);
    }

    for (let i in listeners) listeners[i](objects);
  }

  function read({ paths }: GrafooObject, variables?: Variables) {
    let data = {};
    let objects: ObjectsMap = {};

    for (let path in paths) {
      let { name, args } = paths[path];
      let currentPath = pathsMap[getPathId(path, args, variables)];

      if (currentPath) {
        data[name] = currentPath.data[name];

        for (let i in currentPath.objects) objects[i] = currentPath.objects[i];
      }
    }

    if (!Object.keys(data).length) return {};

    return { data: buildQueryTree(data, objectsMap, idFields), objects };
  }

  function flush() {
    return { objectsMap, pathsMap };
  }

  return { request, listen, write, read, flush };
}
