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
  const { initialState = { pathsMap: {}, objectsMap: {} }, idFields } = options;
  const pathsMap = initialState.pathsMap;
  const objectsMap = initialState.objectsMap;
  const listeners = [];
  const transportRequest = createTransport(uri, options && options.headers);

  function request<T>({ query, frags }: GrafooObject, variables?: Variables) {
    if (frags) for (const frag in frags) query += frags[frag];

    return transportRequest<T>(query, variables);
  }

  function listen(listener: Listener) {
    listeners.push(listener);

    return () => {
      const index = listeners.indexOf(listener);

      if (index < 0) return;

      listeners.splice(index, 1);
    };
  }

  function write({ paths }: GrafooObject, variables: Variables | {}, data?: {}) {
    if (!data) data = variables;

    const objects: ObjectsMap = {};

    for (const path in paths) {
      const { name, args } = paths[path];
      const pathData = { [name]: data[name] };
      const pathObjects = mapObjects(pathData, idFields);

      Object.assign(objects, pathObjects);

      pathsMap[getPathId(path, args, variables)] = { data: pathData, objects: pathObjects };
    }

    for (const i in objects)
      objectsMap[i] = objects[i] = Object.assign({}, objectsMap[i], objects[i]);

    for (const listener of listeners) listener(objects);
  }

  function read({ paths }: GrafooObject, variables?: Variables) {
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
  }

  function flush() {
    return { objectsMap, pathsMap };
  }

  return { request, listen, write, read, flush };
}
