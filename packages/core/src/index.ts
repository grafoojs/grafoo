import {
  GrafooClient,
  GrafooClientOptions,
  GrafooObject,
  Listener,
  ObjectsMap,
  Variables,
  GrafooTransport
} from "@grafoo/types";
import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";
import { getPathId } from "./util";

export default function createClient(
  transport: GrafooTransport,
  options?: GrafooClientOptions
): GrafooClient {
  let { initialState, idFields } = options;
  let { pathsMap, objectsMap } = initialState || { pathsMap: {}, objectsMap: {} };
  let listeners: Listener[] = [];

  function execute<T>({ query, frags }: GrafooObject, variables?: Variables) {
    if (frags) for (let frag in frags) query += frags[frag];

    return transport<T>(query, variables);
  }

  function listen(listener: Listener) {
    listeners.push(listener);

    return () => {
      let index = listeners.indexOf(listener);

      if (index < 0) return;

      listeners.splice(index, 1);
    };
  }

  function write({ paths }: GrafooObject, variables: Variables, data?: {}) {
    if (!data) {
      data = variables;
      variables = undefined;
    }

    let objects: ObjectsMap = {};

    for (let i in paths) {
      let { name, args } = paths[i];
      let pathData = { [name]: data[name] };
      let pathObjects = mapObjects(pathData, idFields);

      Object.assign(objects, pathObjects);

      pathsMap[getPathId(i, args, variables)] = {
        data: pathData,
        objects: Object.keys(pathObjects)
      };
    }

    // assign new values to objects in objectsMap
    for (let i in objects) {
      objectsMap[i] = objects[i] = Object.assign({}, objectsMap[i], objects[i]);
    }

    // clean cache
    let pathsObjects = [];
    for (let i in pathsMap) pathsObjects = pathsObjects.concat(pathsMap[i].objects);
    let allObjects = new Set(pathsObjects);
    for (let i in objectsMap) if (!allObjects.has(i)) delete objectsMap[i];

    // run listeners
    for (let i in listeners) listeners[i](objects);
  }

  function read({ paths }: GrafooObject, variables?: Variables) {
    let data = {};
    let objects: ObjectsMap = {};

    for (let i in paths) {
      let { name, args } = paths[i];
      let currentPath = pathsMap[getPathId(i, args, variables)];

      if (currentPath) {
        data[name] = currentPath.data[name];

        for (let i of currentPath.objects) objects[i] = objectsMap[i];
      }
    }

    return Object.keys(data).length
      ? { data: buildQueryTree(data, objectsMap, idFields), objects }
      : {};
  }

  function flush() {
    return { objectsMap, pathsMap };
  }

  return { execute, listen, write, read, flush };
}
