import buildQueryTree from "./build-query-tree";
import mapRecords from "./map-records";
import { getPathId } from "./util";

export type GraphQlError = {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
};

export type GraphQlPayload<T> = {
  data: T;
  errors?: GraphQlError[];
};

export type GrafooTransport = <T>(
  query: string,
  variables?: unknown,
  id?: string
) => Promise<GraphQlPayload<T>>;

export type GrafooRecords = Record<string, Record<string, unknown>>;

export type GrafooPaths = Record<
  string,
  {
    data: Record<string, unknown>;
    records: string[];
    partial?: boolean;
  }
>;

export type GrafooListener = (objects: GrafooRecords) => void;

export type GrafooInitialState = {
  records: GrafooRecords;
  paths: GrafooPaths;
};

export type GrafooShape = ({ id?: string } | { [key: string]: GrafooShape }) | GrafooShape[];

export type GrafooSelection = {
  args?: string[];
  scalars?: string[];
  fragments?: string[];
  select?: Record<string, GrafooSelection>;
};

export type GrafooQuery<T = unknown, U = unknown> = {
  query: string;
  frags?: Record<string, string>;
  paths: Record<string, { name: string; args: string[] }>;
  selections: GrafooSelection;
  fragments: GrafooSelection;
  _queryType: T;
  _variablesType: U;
};

export type GrafooClient = {
  execute: <T extends GrafooQuery>(
    query: T,
    variables?: T["_variablesType"]
  ) => Promise<GraphQlPayload<T["_queryType"]>>;
  listen: (listener: GrafooListener) => () => void;
  write: {
    <T extends GrafooQuery>(query: T, variables: T["_variablesType"], data: T["_queryType"]): void;
    <T extends GrafooQuery>(query: T, data: T["_queryType"]): void;
  };
  read: <T extends GrafooQuery>(
    query: T,
    variables?: T["_variablesType"]
  ) => { data?: T["_queryType"]; records?: GrafooRecords; partial?: boolean };
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
  let { paths, records } = initialState || { paths: {}, records: {} };
  let listeners: GrafooListener[] = [];

  function execute<T extends GrafooQuery>({ query, frags }: T, variables?: T["_variablesType"]) {
    if (frags) for (let frag in frags) query += frags[frag];

    return transport<T>(query, variables);
  }

  function listen(listener: GrafooListener) {
    listeners.push(listener);

    return () => {
      let index = listeners.indexOf(listener);

      if (index < 0) return;

      listeners.splice(index, 1);
    };
  }

  function write<T extends GrafooQuery>(
    query: T,
    variables: T["_variablesType"],
    data?: T["_queryType"]
  ) {
    if (!data) {
      data = variables as T["_queryType"];
      variables = undefined;
    }

    let queryRecords: GrafooRecords = {};

    for (let path in query.paths) {
      let { name, args } = query.paths[path];
      let pathData = {
        [name]: data[name]
      };

      let pathRecords = mapRecords(pathData, idFields);

      Object.assign(queryRecords, pathRecords);

      paths[getPathId(path, args, variables)] = {
        data: pathData,
        records: Object.keys(pathRecords)
      };
    }

    // assign new values to records
    for (let i in queryRecords) {
      records[i] = queryRecords[i] = Object.assign({}, records[i], queryRecords[i]);
    }

    // clean cache
    let idsList: string[] = [];
    for (let i in paths) idsList = idsList.concat(paths[i].records);
    let allIds = new Set(idsList);
    for (let i in records) if (!allIds.has(i)) delete records[i];

    // run listeners
    for (let i in listeners) listeners[i](queryRecords);
  }

  function read<T extends GrafooQuery>(
    query: T,
    variables?: T["_variablesType"]
  ): { data?: T["_queryType"]; records?: GrafooRecords; partial?: boolean } {
    let data: T["_queryType"] = {};
    let queryRecords: GrafooRecords = {};
    let partial = false;

    for (let path in query.paths) {
      let { name, args } = query.paths[path];
      let currentPath = paths[getPathId(path, args, variables)];

      if (currentPath) {
        data[name] = currentPath.data[name];

        for (let i of currentPath.records) queryRecords[i] = records[i];
      } else {
        partial = true;
      }
    }

    return Object.keys(data).length
      ? { data: buildQueryTree(data, records, idFields), records: queryRecords, partial }
      : {};
  }

  function flush() {
    return { records, paths };
  }

  function reset() {
    paths = {};
    records = {};
  }

  return { execute, listen, write, read, flush, reset };
}
