import buildQueryTree from "./build-query-tree";
import mapObjects from "./map-objects";
import { getPathId } from "./util";

export type GraphQlError = {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
};

/**
 * T = QueryData
 */
export type GraphQlPayload<T> = {
  data: T;
  errors?: GraphQlError[];
};

/**
 * T = QueryData
 */
export type GrafooTransport = <T>(
  query: string,
  variables?: unknown,
  id?: string
) => Promise<GraphQlPayload<T>>;

export type GrafooObjectsMap = {
  [key: string]: Record<string, unknown>;
};

export type GrafooPathsMap = {
  [key: string]: {
    data: { [key: string]: unknown };
    objects: string[];
    partial?: boolean;
  };
};

export type GrafooListener = (objects: GrafooObjectsMap) => void;

export type GrafooInitialState = {
  objectsMap: GrafooObjectsMap;
  pathsMap: GrafooPathsMap;
};

export type GrafooObject<T = unknown, U = unknown> = {
  frags?: {
    [key: string]: string;
  };
  paths: {
    [key: string]: {
      name: string;
      args: string[];
    };
  };
  query: string;
  id?: string;
  _queryType: T;
  _variablesType: U;
};

export type GrafooClient = {
  execute: <T extends GrafooObject>(
    grafooObject: T,
    variables?: T["_variablesType"]
  ) => Promise<GraphQlPayload<T["_queryType"]>>;
  listen: (listener: GrafooListener) => () => void;
  write: {
    <T extends GrafooObject>(
      grafooObject: T,
      variables: T["_variablesType"],
      data: T["_queryType"] | { data: T["_queryType"] }
    ): void;
    <T extends GrafooObject>(
      grafooObject: T,
      data: T["_queryType"] | { data: T["_queryType"] }
    ): void;
  };
  read: <T extends GrafooObject>(
    grafooObject: T,
    variables?: T["_variablesType"]
  ) => { data?: T["_queryType"]; objects?: GrafooObjectsMap; partial?: boolean };
  flush: () => GrafooInitialState;
  reset: () => void;
};

export type GrafooClientOptions = {
  initialState?: GrafooInitialState;
  idFields?: Array<string>;
};

export default function createClient(
  transport: GrafooTransport,
  options?: GrafooClientOptions
): GrafooClient {
  let { initialState, idFields } = options;
  let { pathsMap, objectsMap } = initialState || { pathsMap: {}, objectsMap: {} };
  let listeners: GrafooListener[] = [];

  function execute<T extends GrafooObject>(
    { query, frags, id }: T,
    variables?: T["_variablesType"]
  ) {
    if (frags) for (let frag in frags) query += frags[frag];

    return transport<T>(query, variables, id);
  }

  function listen(listener: GrafooListener) {
    listeners.push(listener);

    return () => {
      let index = listeners.indexOf(listener);

      if (index < 0) return;

      listeners.splice(index, 1);
    };
  }

  function write<T extends GrafooObject>(
    { paths }: T,
    variables: T["_variablesType"],
    data?: T["_queryType"] | { data: T["_queryType"] }
  ) {
    if (!data) {
      data = variables as typeof data;
      variables = undefined;
    }

    let objects: GrafooObjectsMap = {};

    for (let i in paths) {
      let { name, args } = paths[i];
      let pathData = {
        [name]: (data as { data: T }).data ? (data as { data: T }).data[name] : data[name]
      };
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

  function read<T extends GrafooObject>(
    { paths }: T,
    variables?: T["_variablesType"]
  ): { data?: T["_queryType"]; objects?: GrafooObjectsMap; partial?: boolean } {
    let data: T["_queryType"] = {};
    let objects: GrafooObjectsMap = {};
    let partial = false;

    for (let i in paths) {
      let { name, args } = paths[i];
      let currentPath = pathsMap[getPathId(i, args, variables)];

      if (currentPath) {
        data[name] = currentPath.data[name];

        for (let i of currentPath.objects) objects[i] = objectsMap[i];
      } else {
        partial = true;
      }
    }

    return Object.keys(data).length
      ? { data: buildQueryTree(data, objectsMap, idFields), objects, partial }
      : {};
  }

  function flush() {
    return { objectsMap, pathsMap };
  }

  function reset() {
    pathsMap = {};
    objectsMap = {};
  }

  return { execute, listen, write, read, flush, reset };
}
